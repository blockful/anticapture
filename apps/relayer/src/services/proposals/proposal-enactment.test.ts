import { describe, it, expect } from "vitest";
import {
  Address,
  Hash,
  Hex,
  encodeFunctionData,
  keccak256,
  parseEther,
  toBytes,
} from "viem";

import { governorAbi, ProposalState } from "@/abi/governor";
import { createLogger } from "@anticapture/observability";
import { RelayError } from "@/errors";
import type { GovernorGateway } from "@/services/chain/governor-gateway";
import { RelayerSigner } from "@/signer/types";

import { ProposalEnactmentService } from "./proposal-enactment";
import type { ProposalArgs, ProposalSource } from "./proposal-source";

const silentLogger = createLogger("proposal-enactment-test");
silentLogger.level = "silent";

const GOVERNOR: Address = "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3";
const RELAYER: Address = "0x1111111111111111111111111111111111111111";
const TX_HASH: Hash = `0x${"ab".repeat(32)}`;
const NOW = 1_700_000_000n;

const ARGS: ProposalArgs = {
  targets: ["0x0000000000000000000000000000000000000001"],
  values: [0n],
  calldatas: ["0xdeadbeef"],
  description: "# Do the thing",
};
const DESCRIPTION_HASH = keccak256(toBytes(ARGS.description));
const PROPOSAL_ID = 42n;

function createStubSource(
  proposals: Record<string, ProposalArgs> = {
    [PROPOSAL_ID.toString()]: { ...ARGS },
  },
): ProposalSource {
  return {
    getProposal: async (proposalId) => proposals[proposalId] ?? null,
  };
}

function createStubSigner() {
  const sent: { to: Address; data: Hex; value?: bigint }[] = [];
  const signer: RelayerSigner = {
    getAddress: async () => RELAYER,
    sendTransaction: async (tx) => {
      sent.push(tx);
      return TX_HASH;
    },
  };
  return { signer, sent };
}

function createStubGovernor(overrides: Partial<GovernorGateway> = {}) {
  const simulated: { functionName: string }[] = [];
  const governor: GovernorGateway = {
    hashProposal: async () => PROPOSAL_ID,
    state: async () => ProposalState.Succeeded,
    proposalEta: async () => 0n,
    blockTimestamp: async () => NOW,
    balanceOf: async () => parseEther("1"),
    simulate: async (functionName) => {
      simulated.push({ functionName });
    },
    waitForReceipt: async () => {},
    ...overrides,
  };
  return { governor, simulated };
}

function createService(
  overrides: {
    governor?: Partial<GovernorGateway>;
    source?: ProposalSource;
  } = {},
) {
  const { governor, simulated } = createStubGovernor(overrides.governor);
  const { signer, sent } = createStubSigner();
  const service = new ProposalEnactmentService(
    governor,
    signer,
    overrides.source ?? createStubSource(),
    { governorAddress: GOVERNOR, minBalanceWei: parseEther("0.1").valueOf() },
    silentLogger,
  );
  return { service, sent, simulated };
}

async function expectRelayError(
  promise: Promise<unknown>,
  code: string,
  status: number,
): Promise<void> {
  const error = await promise.then(
    () => null,
    (e) => e as RelayError,
  );
  expect(error, `expected ${code} to be thrown`).toBeInstanceOf(RelayError);
  expect(error?.code).toBe(code);
  expect(error?.status).toBe(status);
}

describe("ProposalEnactmentService.queue", () => {
  it("broadcasts queue() for a succeeded proposal", async () => {
    const { service, sent, simulated } = createService({
      governor: { state: async () => ProposalState.Succeeded },
    });

    const result = await service.queue(PROPOSAL_ID.toString());

    expect(result).toEqual({ txHash: TX_HASH });
    expect(sent).toEqual([
      {
        to: GOVERNOR,
        data: encodeFunctionData({
          abi: governorAbi,
          functionName: "queue",
          args: [ARGS.targets, ARGS.values, ARGS.calldatas, DESCRIPTION_HASH],
        }),
      },
    ]);
    expect(simulated).toEqual([{ functionName: "queue" }]);
  });

  it("rejects when the proposal is not in Succeeded state", async () => {
    const { service, sent } = createService({
      governor: { state: async () => ProposalState.Active },
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "INVALID_PROPOSAL_STATE",
      409,
    );
    expect(sent).toEqual([]);
  });
});

describe("ProposalEnactmentService.execute", () => {
  it("broadcasts execute() for a queued proposal past its eta", async () => {
    const { service, sent } = createService({
      governor: {
        state: async () => ProposalState.Queued,
        proposalEta: async () => NOW - 1n,
      },
    });

    const result = await service.execute(PROPOSAL_ID.toString());

    expect(result).toEqual({ txHash: TX_HASH });
    expect(sent).toEqual([
      {
        to: GOVERNOR,
        data: encodeFunctionData({
          abi: governorAbi,
          functionName: "execute",
          args: [ARGS.targets, ARGS.values, ARGS.calldatas, DESCRIPTION_HASH],
        }),
      },
    ]);
  });

  it("executes exactly at the eta", async () => {
    const { service } = createService({
      governor: {
        state: async () => ProposalState.Queued,
        proposalEta: async () => NOW,
      },
    });

    await expect(service.execute(PROPOSAL_ID.toString())).resolves.toEqual({
      txHash: TX_HASH,
    });
  });

  it("rejects before the timelock eta", async () => {
    const { service, sent } = createService({
      governor: {
        state: async () => ProposalState.Queued,
        proposalEta: async () => NOW + 1n,
      },
    });

    await expectRelayError(
      service.execute(PROPOSAL_ID.toString()),
      "TIMELOCK_NOT_READY",
      409,
    );
    expect(sent).toEqual([]);
  });

  it("rejects when the proposal is not in Queued state", async () => {
    const { service, sent } = createService({
      governor: { state: async () => ProposalState.Succeeded },
    });

    await expectRelayError(
      service.execute(PROPOSAL_ID.toString()),
      "INVALID_PROPOSAL_STATE",
      409,
    );
    expect(sent).toEqual([]);
  });
});

describe("ProposalEnactmentService guards", () => {
  it("rejects unknown proposals with 404", async () => {
    const { service } = createService({ source: createStubSource({}) });

    await expectRelayError(service.queue("999"), "PROPOSAL_NOT_FOUND", 404);
  });

  it("rejects when API data does not hash to the requested proposal id", async () => {
    const { service, sent } = createService({
      governor: { hashProposal: async () => PROPOSAL_ID + 1n },
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "PROPOSAL_DATA_MISMATCH",
      422,
    );
    expect(sent).toEqual([]);
  });

  it("rejects when the relayer balance is below the minimum", async () => {
    const { service, sent } = createService({
      governor: { balanceOf: async () => parseEther("0.01") },
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "RELAYER_LOW_BALANCE",
      503,
    );
    expect(sent).toEqual([]);
  });

  it("propagates simulation reverts without broadcasting", async () => {
    const { service, sent } = createService({
      governor: {
        simulate: async () => {
          throw new Error("execution reverted: TimelockController");
        },
      },
    });

    await expect(service.queue(PROPOSAL_ID.toString())).rejects.toThrow(
      /execution reverted/,
    );
    expect(sent).toEqual([]);
  });
});
