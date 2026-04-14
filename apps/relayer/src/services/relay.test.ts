import { describe, it, expect } from "vitest";
import { type Address, type Hash, type Hex, parseEther } from "viem";

import { RelayService } from "./relay";
import { ProposalState } from "@/abi/governor";
import type { RelayerSigner } from "@/signer/types";
import type { SignatureVerifier } from "./signature-verifier";
import type { EligibilityService } from "./eligibility";
import type { ChainStateService } from "./chain-state";
import type { RateLimiter } from "@/lib/rate-limiter";
import { createStubPublicClient } from "../test-utils/stub-public-client";

const VOTER = "0x3333333333333333333333333333333333333333" as Address;
const GOVERNOR = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const TX_HASH =
  "0xabcd000000000000000000000000000000000000000000000000000000000001" as Hash;

const SAMPLE_R =
  "0x1111111111111111111111111111111111111111111111111111111111111111" as Hex;
const SAMPLE_S =
  "0x2222222222222222222222222222222222222222222222222222222222222222" as Hex;

function createStubSigner(
  overrides: Partial<RelayerSigner> = {},
): RelayerSigner {
  return {
    address: "0x9999999999999999999999999999999999999999" as Address,
    sendTransaction: async () => TX_HASH,
    ...overrides,
  };
}

function createStubSignatureVerifier(
  overrides: Partial<SignatureVerifier> = {},
): SignatureVerifier {
  return {
    recoverVoteSigner: async () => VOTER,
    recoverDelegationSigner: async () => VOTER,
    ...overrides,
  } as SignatureVerifier;
}

function createStubEligibility(
  overrides: Partial<EligibilityService> = {},
): EligibilityService {
  return {
    assertCanVote: async () => {},
    assertCanDelegate: async () => {},
    ...overrides,
  } as EligibilityService;
}

function createStubChainState(
  overrides: Partial<ChainStateService> = {},
): ChainStateService {
  return {
    getProposalState: async () => ProposalState.Active,
    hasVoted: async () => false,
    getDelegationNonce: async () => 0n,
    getVotingPower: async () => 0n,
    getCurrentDelegate: async () =>
      "0x0000000000000000000000000000000000000000" as Address,
    getGovernorName: async () => "TestGovernor",
    getTokenName: async () => "TestToken",
    ...overrides,
  } as ChainStateService;
}

function createStubRateLimiter(): RateLimiter {
  return {
    checkAllowed: () => {},
    recordUsage: () => {},
    reset: () => {},
  } as unknown as RateLimiter;
}

function createService(
  overrides: {
    signer?: RelayerSigner;
    signatureVerifier?: SignatureVerifier;
    eligibility?: EligibilityService;
    chainState?: ChainStateService;
    rateLimiter?: RateLimiter;
    balance?: bigint;
  } = {},
): RelayService {
  const stubClient = createStubPublicClient();
  stubClient.setGetBalanceResult(overrides.balance ?? parseEther("1.0"));

  return new RelayService(
    overrides.signer ?? createStubSigner(),
    overrides.signatureVerifier ?? createStubSignatureVerifier(),
    overrides.eligibility ?? createStubEligibility(),
    overrides.chainState ?? createStubChainState(),
    overrides.rateLimiter ?? createStubRateLimiter(),
    stubClient,
    parseEther("0.1"),
    GOVERNOR,
    TOKEN,
  );
}

describe("RelayService", () => {
  describe("relayVote", () => {
    const voteParams = {
      proposalId: 1n,
      support: 1,
      v: 27,
      r: SAMPLE_R,
      s: SAMPLE_S,
    };

    it("returns tx hash and recovered signer when all checks pass", async () => {
      const service = createService();

      const result = await service.relayVote(voteParams);

      expect(result).toEqual({ hash: TX_HASH, signer: VOTER });
    });

    it("rejects when proposal is not active", async () => {
      const service = createService({
        chainState: createStubChainState({
          getProposalState: async () => ProposalState.Pending,
        }),
      });

      await expect(service.relayVote(voteParams)).rejects.toThrow(
        "not in active",
      );
    });

    it("rejects when voter already voted", async () => {
      const service = createService({
        chainState: createStubChainState({
          hasVoted: async () => true,
        }),
      });

      await expect(service.relayVote(voteParams)).rejects.toThrow(
        "already voted",
      );
    });

    it("rejects when relayer balance is low", async () => {
      const service = createService({
        balance: parseEther("0.01"),
      });

      await expect(service.relayVote(voteParams)).rejects.toThrow(
        "balance is too low",
      );
    });
  });

  describe("relayDelegation", () => {
    const delegateParams = {
      delegatee: "0x5555555555555555555555555555555555555555" as Address,
      nonce: 0n,
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      v: 27,
      r: SAMPLE_R,
      s: SAMPLE_S,
    };

    it("returns tx hash and recovered signer when all checks pass", async () => {
      const service = createService();

      const result = await service.relayDelegation(delegateParams);

      expect(result).toEqual({ hash: TX_HASH, signer: VOTER });
    });

    it("rejects when signature has expired", async () => {
      const service = createService();
      const expired = {
        ...delegateParams,
        expiry: BigInt(Math.floor(Date.now() / 1000) - 1),
      };

      await expect(service.relayDelegation(expired)).rejects.toThrow("expired");
    });

    it("rejects when nonce doesn't match on-chain", async () => {
      const service = createService({
        chainState: createStubChainState({
          getDelegationNonce: async () => 5n,
        }),
      });

      await expect(service.relayDelegation(delegateParams)).rejects.toThrow(
        "Nonce mismatch",
      );
    });
  });
});
