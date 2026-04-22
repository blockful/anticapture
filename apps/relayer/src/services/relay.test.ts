import { describe, it, expect } from "vitest";
import { getAddress, type Hash, type Hex } from "viem";

import { RelayService } from "./relay";
import type { RelayerSigner } from "@/signer/types";
import type { ISignatureVerifier } from "./guards/signature-verifier";
import type { IChainStateService } from "./chain/chain-state";
import type { IRateLimiter } from "@/services/guards/rate-limiter";
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
  overrides: Partial<ISignatureVerifier> = {},
): ISignatureVerifier {
  return {
    recoverVoteSigner: async () => VOTER,
    recoverDelegationSigner: async () => VOTER,
    ...overrides,
  };
}

function createStubChainState(
  overrides: Partial<IChainStateService> = {},
): IChainStateService {
  return {
    getProposalState: async () => 1,
    hasVoted: async () => false,
    getDelegationNonce: async () => 0n,
    getVotingPower: async () => 0n,
    getTokenBalance: async () => 0n,
    getCurrentDelegate: async () =>
      getAddress("0x0000000000000000000000000000000000000000"),
    getGovernorName: async () => "TestGovernor",
    getTokenName: async () => "TestToken",
    ...overrides,
  };
}

function createStubRateLimiter(): IRateLimiter {
  return {
    assertWithinLimit: async () => {},
  };
}

function createStubChainReader(): ChainReader {
  return {
    getBalance: async () => 0n,
    readContract: (async () => undefined) as ChainReader["readContract"],
    simulateContract: (async () => ({
      request: {},
      result: undefined,
    })) as unknown as ChainReader["simulateContract"],
  };
}

function createService(
  overrides: {
    signer?: RelayerSigner;
    signatureVerifier?: ISignatureVerifier;
    chainState?: IChainStateService;
    rateLimiter?: IRateLimiter;
    minVotingPower?: bigint;
    chainReader?: ChainReader;
  } = {},
): RelayService {
  return new RelayService(
    overrides.signer ?? createStubSigner(),
    overrides.signatureVerifier ?? createStubSignatureVerifier(),
    overrides.chainState ?? createStubChainState(),
    overrides.rateLimiter ?? createStubRateLimiter(),
    overrides.chainReader ?? createStubChainReader(),
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

    // NOTE: proposal-state, hasVoted, and nonce-mismatch assertions previously
    // lived here as explicit preflight checks. They now travel through
    // publicClient.simulateContract, which reverts with the on-chain reason.
    // Those paths are exercised in e2e tests against anvil instead of mocks.

    it("returns tx hash and recovered signer when all checks pass", async () => {
      const service = createService();

      const result = await service.relayVote(voteParams);

      expect(result).toEqual({ hash: TX_HASH, signer: VOTER });
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

    it("rejects voter with tokens but no delegation (getVotes == 0)", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 0n,
          getTokenBalance: async () => 1000n,
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

    it("passes when token balance alone meets threshold (first-time delegator)", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 0n,
          getTokenBalance: async () => 1000n,
        }),
        minVotingPower: 1000n,
      });

      const result = await service.relayDelegation(delegateParams);
      expect(result).toEqual({ hash: TX_HASH, signer: VOTER });
    });

    it("rejects when neither voting power nor balance meets threshold", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 999n,
          getTokenBalance: async () => 500n,
        }),
        minVotingPower: 1000n,
      });

      await expect(service.relayDelegation(delegateParams)).rejects.toThrow(
        "minimum voting power",
      );
    });
  });
});
