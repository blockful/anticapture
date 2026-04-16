import { describe, it, expect } from "vitest";
import { getAddress, type Hash, type Hex, parseEther } from "viem";

import { RelayService } from "./relay";
import { ProposalState } from "@/abi/governor";
import type { RelayerSigner } from "@/signer/types";
import type { SignatureVerifier } from "./guards/signature-verifier";
import type { ChainStateService } from "./chain/chain-state";
import type { RateLimiter } from "@/services/guards/rate-limiter";
import type { ChainReader } from "./chain/chain-reader";

const VOTER = getAddress("0x3333333333333333333333333333333333333333");
const GOVERNOR = getAddress("0x1111111111111111111111111111111111111111");
const TOKEN = getAddress("0x2222222222222222222222222222222222222222");
const TX_HASH: Hash =
  "0xabcd000000000000000000000000000000000000000000000000000000000001";

const SAMPLE_R: Hex =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const SAMPLE_S: Hex =
  "0x2222222222222222222222222222222222222222222222222222222222222222";

function createStubSigner(
  overrides: Partial<RelayerSigner> = {},
): RelayerSigner {
  return {
    address: getAddress("0x9999999999999999999999999999999999999999"),
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

function createStubChainState(
  overrides: Partial<ChainStateService> = {},
): ChainStateService {
  return {
    getProposalState: async () => ProposalState.Active,
    hasVoted: async () => false,
    getDelegationNonce: async () => 0n,
    getVotingPower: async () => 0n,
    getCurrentDelegate: async () =>
      getAddress("0x0000000000000000000000000000000000000000"),
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

function createStubBalanceReader(balance: bigint): ChainReader {
  return {
    getBalance: async () => balance,
    readContract: (async () => undefined) as ChainReader["readContract"],
  };
}

function createService(
  overrides: {
    signer?: RelayerSigner;
    signatureVerifier?: SignatureVerifier;
    chainState?: ChainStateService;
    rateLimiter?: RateLimiter;
    balance?: bigint;
    minVotingPower?: bigint;
  } = {},
): RelayService {
  return new RelayService(
    overrides.signer ?? createStubSigner(),
    overrides.signatureVerifier ?? createStubSignatureVerifier(),
    overrides.chainState ?? createStubChainState(),
    overrides.rateLimiter ?? createStubRateLimiter(),
    createStubBalanceReader(overrides.balance ?? parseEther("1.0")),
    parseEther("0.1"),
    overrides.minVotingPower ?? 0n,
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

    it("rejects when voting power is below threshold", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 999n,
        }),
        minVotingPower: 1000n,
      });

      await expect(service.relayVote(voteParams)).rejects.toThrow(
        "minimum voting power",
      );
    });
  });

  describe("relayDelegation", () => {
    const delegateParams = {
      delegatee: getAddress("0x5555555555555555555555555555555555555555"),
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
