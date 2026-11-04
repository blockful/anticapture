import { describe, it, expect } from "vitest";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  getAddress,
  HttpRequestError,
  type Hash,
  type Hex,
} from "viem";

import { governorAbi } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { RelayError } from "@/errors";
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
    getAddress: async () =>
      getAddress("0x9999999999999999999999999999999999999999"),
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
    getVotingPower: async () => 0n,
    getTokenBalance: async () => 0n,
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

function createStubChainReader(
  simulate: () => Promise<unknown> = async () => ({
    request: {},
    result: undefined,
  }),
): ChainReader {
  return {
    getBalance: async () => 0n,
    readContract: (async () => undefined) as ChainReader["readContract"],
    simulateContract: simulate as unknown as ChainReader["simulateContract"],
  };
}

/** What viem's simulateContract throws when the contract reverts. */
function contractRevert(
  abi: typeof governorAbi | typeof erc20VotesAbi,
  functionName: string,
  args: unknown[],
  reason: string,
) {
  return new ContractFunctionExecutionError(
    new ContractFunctionRevertedError({ abi, functionName, message: reason }),
    { abi, functionName, args, contractAddress: GOVERNOR },
  );
}

/** Captures what the service threw, so its fields can be asserted on. */
async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("expected the promise to reject");
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

    // A replayed signature is the common case: the wallet signs the same
    // Ballot deterministically, so a second click resends identical bytes.
    it("answers 409 SIMULATION_FAILED, without sending, when the vote would revert", async () => {
      let sent = false;
      const service = createService({
        signer: createStubSigner({
          sendTransaction: async () => {
            sent = true;
            return TX_HASH;
          },
        }),
        chainReader: createStubChainReader(async () => {
          throw contractRevert(
            governorAbi,
            "castVoteBySig",
            [1n, 1, 27, SAMPLE_R, SAMPLE_S],
            "GovernorVotingSimple: vote already cast",
          );
        }),
      });

      const err = await caught(service.relayVote(voteParams));

      expect(err).toBeInstanceOf(RelayError);
      expect(err).toMatchObject({ code: "SIMULATION_FAILED", status: 409 });
      expect((err as RelayError).message).toContain(
        "GovernorVotingSimple: vote already cast",
      );
      expect(sent).toBe(false);
    });

    it("lets a simulation that could not run surface as an unhandled error", async () => {
      const transportError = new HttpRequestError({ url: "http://rpc" });
      const service = createService({
        chainReader: createStubChainReader(async () => {
          throw transportError;
        }),
      });

      await expect(service.relayVote(voteParams)).rejects.toBe(transportError);
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

    it("rejects when balance is below threshold", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 0n,
          getTokenBalance: async () => 500n,
        }),
        minVotingPower: 1000n,
      });

      await expect(service.relayDelegation(delegateParams)).rejects.toThrow(
        "minimum voting power",
      );
    });

    it("rejects delegate-of-whale: voting power alone does not qualify", async () => {
      const service = createService({
        chainState: createStubChainState({
          getVotingPower: async () => 5000n,
          getTokenBalance: async () => 0n,
        }),
        minVotingPower: 1000n,
      });

      await expect(service.relayDelegation(delegateParams)).rejects.toThrow(
        "minimum voting power",
      );
    });

    it("answers 409 SIMULATION_FAILED, without sending, when the delegation would revert", async () => {
      let sent = false;
      const service = createService({
        signer: createStubSigner({
          sendTransaction: async () => {
            sent = true;
            return TX_HASH;
          },
        }),
        chainReader: createStubChainReader(async () => {
          throw contractRevert(
            erc20VotesAbi,
            "delegateBySig",
            [VOTER, 0n, 0n, 27, SAMPLE_R, SAMPLE_S],
            "ERC20Votes: invalid nonce",
          );
        }),
      });

      const err = await caught(service.relayDelegation(delegateParams));

      expect(err).toBeInstanceOf(RelayError);
      expect(err).toMatchObject({ code: "SIMULATION_FAILED", status: 409 });
      expect((err as RelayError).message).toContain(
        "ERC20Votes: invalid nonce",
      );
      expect(sent).toBe(false);
    });
  });
});
