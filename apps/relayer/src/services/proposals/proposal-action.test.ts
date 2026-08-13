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
import { RelayerSigner } from "@/signer/types";

import {
  ProposalActionService,
  type ActionChainReader,
} from "./proposal-action";
import type { ProposalArgs, ProposalSource } from "./proposal-source";

const silentLogger = createLogger("proposal-action-test");
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

class FakeSource implements ProposalSource {
  constructor(private proposals: Record<string, ProposalArgs> = {}) {}
  async getProposal(proposalId: string): Promise<ProposalArgs | null> {
    return this.proposals[proposalId] ?? null;
  }
}

class FakeSigner implements RelayerSigner {
  sent: { to: Address; data: Hex; value?: bigint }[] = [];
  async getAddress(): Promise<Address> {
    return RELAYER;
  }
  async sendTransaction(tx: {
    to: Address;
    data: Hex;
    value?: bigint;
  }): Promise<Hash> {
    this.sent.push(tx);
    return TX_HASH;
  }
}

class FakeChain {
  state: ProposalState = ProposalState.Succeeded;
  eta = 0n;
  hashedProposalId = PROPOSAL_ID;
  balance = parseEther("1");
  blockTimestamp = NOW;
  simulateError: Error | null = null;
  simulated: { functionName: string; args: unknown }[] = [];

  async readContract(params: {
    functionName: string;
    args?: readonly unknown[];
  }): Promise<unknown> {
    switch (params.functionName) {
      case "hashProposal":
        return this.hashedProposalId;
      case "state":
        return this.state;
      case "proposalEta":
        return this.eta;
      default:
        throw new Error(`unexpected read: ${params.functionName}`);
    }
  }

  async simulateContract(params: {
    functionName: string;
    args: unknown;
  }): Promise<unknown> {
    if (this.simulateError) throw this.simulateError;
    this.simulated.push(params);
    return {};
  }

  async getBalance(): Promise<bigint> {
    return this.balance;
  }

  async getBlock(): Promise<{ timestamp: bigint }> {
    return { timestamp: this.blockTimestamp };
  }

  async waitForTransactionReceipt(): Promise<{ status: string }> {
    return { status: "success" };
  }
}

function setup(overrides?: { source?: ProposalSource }) {
  const chain = new FakeChain();
  const signer = new FakeSigner();
  const source =
    overrides?.source ??
    new FakeSource({ [PROPOSAL_ID.toString()]: { ...ARGS } });
  const service = new ProposalActionService(
    chain as unknown as ActionChainReader,
    signer,
    source,
    { governorAddress: GOVERNOR, minBalanceWei: parseEther("0.1").valueOf() },
    silentLogger,
  );
  return { chain, signer, source, service };
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

describe("ProposalActionService.queue", () => {
  it("broadcasts queue() for a succeeded proposal", async () => {
    const { chain, signer, service } = setup();
    chain.state = ProposalState.Succeeded;

    const result = await service.queue(PROPOSAL_ID.toString());

    expect(result).toEqual({ txHash: TX_HASH });
    expect(signer.sent).toEqual([
      {
        to: GOVERNOR,
        data: encodeFunctionData({
          abi: governorAbi,
          functionName: "queue",
          args: [ARGS.targets, ARGS.values, ARGS.calldatas, DESCRIPTION_HASH],
        }),
      },
    ]);
    expect(chain.simulated).toHaveLength(1);
    expect(chain.simulated[0]?.functionName).toBe("queue");
  });

  it("rejects when the proposal is not in Succeeded state", async () => {
    const { chain, signer, service } = setup();
    chain.state = ProposalState.Active;

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "INVALID_PROPOSAL_STATE",
      409,
    );
    expect(signer.sent).toEqual([]);
  });
});

describe("ProposalActionService.execute", () => {
  it("broadcasts execute() for a queued proposal past its eta", async () => {
    const { chain, signer, service } = setup();
    chain.state = ProposalState.Queued;
    chain.eta = NOW - 1n;

    const result = await service.execute(PROPOSAL_ID.toString());

    expect(result).toEqual({ txHash: TX_HASH });
    expect(signer.sent).toEqual([
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
    const { chain, service } = setup();
    chain.state = ProposalState.Queued;
    chain.eta = NOW;

    await expect(service.execute(PROPOSAL_ID.toString())).resolves.toEqual({
      txHash: TX_HASH,
    });
  });

  it("rejects before the timelock eta", async () => {
    const { chain, signer, service } = setup();
    chain.state = ProposalState.Queued;
    chain.eta = NOW + 1n;

    await expectRelayError(
      service.execute(PROPOSAL_ID.toString()),
      "TIMELOCK_NOT_READY",
      409,
    );
    expect(signer.sent).toEqual([]);
  });

  it("rejects when the proposal is not in Queued state", async () => {
    const { chain, signer, service } = setup();
    chain.state = ProposalState.Succeeded;

    await expectRelayError(
      service.execute(PROPOSAL_ID.toString()),
      "INVALID_PROPOSAL_STATE",
      409,
    );
    expect(signer.sent).toEqual([]);
  });
});

describe("ProposalActionService guards", () => {
  it("rejects unknown proposals with 404", async () => {
    const { service } = setup({ source: new FakeSource() });

    await expectRelayError(service.queue("999"), "PROPOSAL_NOT_FOUND", 404);
  });

  it("rejects when API data does not hash to the requested proposal id", async () => {
    const { chain, signer, service } = setup();
    chain.hashedProposalId = PROPOSAL_ID + 1n;

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "PROPOSAL_DATA_MISMATCH",
      422,
    );
    expect(signer.sent).toEqual([]);
  });

  it("rejects when the relayer balance is below the minimum", async () => {
    const { chain, signer, service } = setup();
    chain.balance = parseEther("0.01");

    await expectRelayError(
      service.queue(PROPOSAL_ID.toString()),
      "RELAYER_LOW_BALANCE",
      503,
    );
    expect(signer.sent).toEqual([]);
  });

  it("propagates simulation reverts without broadcasting", async () => {
    const { chain, signer, service } = setup();
    chain.simulateError = new Error("execution reverted: TimelockController");

    await expect(service.queue(PROPOSAL_ID.toString())).rejects.toThrow(
      /execution reverted/,
    );
    expect(signer.sent).toEqual([]);
  });
});
