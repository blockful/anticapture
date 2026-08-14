import { describe, it, expect } from "vitest";
import {
  Address,
  Hash,
  Hex,
  InsufficientFundsError,
  encodeFunctionData,
  keccak256,
  parseEther,
  stringToBytes,
} from "viem";

import { governorAbi, ProposalState } from "@/abi/governor";
import { createLogger } from "@anticapture/observability";
import { RelayError } from "@/errors";
import type { GovernorGateway } from "@/services/chain/governor-gateway";
import { SimulationRevertError } from "@/services/chain/governor-gateway";
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
const DESCRIPTION_HASH = keccak256(stringToBytes(ARGS.description));
const PROPOSAL_ID = 42n;

function createStubSource(
  proposals: Record<string, ProposalArgs> = {
    [PROPOSAL_ID.toString()]: { ...ARGS },
  },
) {
  const fetched: string[] = [];
  const source: ProposalSource = {
    getProposal: async (proposalId) => {
      fetched.push(proposalId);
      return proposals[proposalId] ?? null;
    },
  };
  return { source, fetched };
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
    address: GOVERNOR,
    hashProposal: async () => PROPOSAL_ID,
    state: async () => ProposalState.Succeeded,
    proposalEta: async () => 0n,
    blockTimestamp: async () => NOW,
    ethBalance: async () => parseEther("1"),
    simulate: async (functionName) => {
      simulated.push({ functionName });
    },
    waitForReceipt: async () => "success",
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
    overrides.source ?? createStubSource().source,
    { minBalanceWei: parseEther("0.1").valueOf() },
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
  it("rejects proposals the governor does not know with 404, before touching the API", async () => {
    const { source, fetched } = createStubSource();
    const { service } = createService({
      governor: { state: async () => null },
      source,
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "PROPOSAL_NOT_FOUND",
      404,
    );
    expect(fetched).toEqual([]);
  });

  it("checks the on-chain state before fetching from the API", async () => {
    const { source, fetched } = createStubSource();
    const { service } = createService({
      governor: { state: async () => ProposalState.Defeated },
      source,
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "INVALID_PROPOSAL_STATE",
      409,
    );
    expect(fetched).toEqual([]);
  });

  it("rejects proposals the API does not know with 404", async () => {
    const { service } = createService({
      source: createStubSource({}).source,
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "PROPOSAL_NOT_FOUND",
      404,
    );
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

  it("hashes a description that looks like hex as UTF-8 text", async () => {
    const hexLikeDescription = "0xdeadbeef";
    const { service, sent } = createService({
      source: createStubSource({
        [PROPOSAL_ID.toString()]: { ...ARGS, description: hexLikeDescription },
      }).source,
    });

    await service.queue(PROPOSAL_ID.toString());

    expect(sent[0]?.data).toBe(
      encodeFunctionData({
        abi: governorAbi,
        functionName: "queue",
        args: [
          ARGS.targets,
          ARGS.values,
          ARGS.calldatas,
          keccak256(stringToBytes(hexLikeDescription)),
        ],
      }),
    );
  });

  it("maps insufficient-funds send failures to RELAYER_LOW_BALANCE", async () => {
    const { governor } = createStubGovernor();
    const signer: RelayerSigner = {
      getAddress: async () => RELAYER,
      sendTransaction: async () => {
        throw new InsufficientFundsError();
      },
    };
    const service = new ProposalEnactmentService(
      governor,
      signer,
      createStubSource().source,
      { minBalanceWei: parseEther("0.1").valueOf() },
      silentLogger,
    );

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "RELAYER_LOW_BALANCE",
      503,
    );
  });

  it("rejects when the relayer balance is below the minimum", async () => {
    const { service, sent } = createService({
      governor: { ethBalance: async () => parseEther("0.01") },
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "RELAYER_LOW_BALANCE",
      503,
    );
    expect(sent).toEqual([]);
  });
});

describe("ProposalEnactmentService broadcast outcomes", () => {
  it("maps simulation reverts to SIMULATION_FAILED without broadcasting", async () => {
    const { service, sent } = createService({
      governor: {
        simulate: async () => {
          throw new SimulationRevertError(
            "TimelockController: insufficient balance",
          );
        },
      },
    });

    const error = await service.queue(PROPOSAL_ID.toString()).then(
      () => null,
      (e) => e as RelayError,
    );

    expect(error).toBeInstanceOf(RelayError);
    expect(error?.code).toBe("SIMULATION_FAILED");
    expect(error?.status).toBe(409);
    expect(error?.message).toContain(
      "TimelockController: insufficient balance",
    );
    expect(sent).toEqual([]);
  });

  it("propagates non-revert simulation failures untouched", async () => {
    const { service, sent } = createService({
      governor: {
        simulate: async () => {
          throw new Error("rpc unreachable");
        },
      },
    });

    await expect(service.queue(PROPOSAL_ID.toString())).rejects.toThrow(
      /rpc unreachable/,
    );
    expect(sent).toEqual([]);
  });

  it("rejects with TRANSACTION_REVERTED when the mined transaction reverted", async () => {
    const { service, sent } = createService({
      governor: { waitForReceipt: async () => "reverted" },
    });

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "TRANSACTION_REVERTED",
      409,
    );
    expect(sent).toHaveLength(1);
  });

  it("still returns the hash when the receipt wait times out", async () => {
    const { service } = createService({
      governor: { waitForReceipt: async () => "timeout" },
    });

    await expect(service.queue(PROPOSAL_ID.toString())).resolves.toEqual({
      txHash: TX_HASH,
    });
  });
});

describe("ProposalEnactmentService in-flight dedup", () => {
  it("joins concurrent duplicate requests into a single broadcast", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { service, sent } = createService({
      governor: {
        simulate: async () => {
          await gate;
        },
      },
    });

    const first = service.queue(PROPOSAL_ID.toString());
    const second = service.queue(PROPOSAL_ID.toString());
    release();

    await expect(first).resolves.toEqual({ txHash: TX_HASH });
    await expect(second).resolves.toEqual({ txHash: TX_HASH });
    expect(sent).toHaveLength(1);
  });

  it("releases the in-flight lock once the request settles", async () => {
    const { service, sent } = createService();

    await service.queue(PROPOSAL_ID.toString());
    await service.queue(PROPOSAL_ID.toString());

    expect(sent).toHaveLength(2);
  });

  it("does not join a queue request with an execute request", async () => {
    const { service } = createService({
      governor: { state: async () => ProposalState.Succeeded },
    });

    const queued = service.queue(PROPOSAL_ID.toString());
    const executed = service.execute(PROPOSAL_ID.toString());

    await expect(queued).resolves.toEqual({ txHash: TX_HASH });
    await expectRelayError(executed, "INVALID_PROPOSAL_STATE", 409);
  });
});
