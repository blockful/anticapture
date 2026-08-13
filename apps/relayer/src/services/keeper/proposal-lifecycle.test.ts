import { describe, it, expect, beforeEach } from "vitest";
import {
  Address,
  encodeFunctionData,
  getAddress,
  Hash,
  Hex,
  keccak256,
  toBytes,
} from "viem";

import { createLogger } from "@anticapture/observability";

import { governorAbi, ProposalState } from "@/abi/governor";
import { RelayerSigner } from "@/signer/types";

const silentLogger = createLogger("keeper-test");
silentLogger.level = "silent";

import {
  ProposalLifecycleService,
  type KeeperChainReader,
  type KeeperStorage,
  type TrackedProposal,
} from "./proposal-lifecycle";

const GOVERNOR = getAddress("0x323A76393544d5ecca80cd6ef2A560C6a395b7E3");
const RELAYER = getAddress("0x1111111111111111111111111111111111111111");
const TARGET = getAddress("0x2222222222222222222222222222222222222222");

const QUEUE_DELAY = 1800;
const EXECUTION_DELAY = 1800;
const MIN_BALANCE = 10n ** 17n; // 0.1 ETH
const START_BLOCK = 50n;

/** now() fixed at a round epoch so delay math is easy to follow. */
const NOW = 1_700_000_000;

interface FakeProposalChainState {
  state?: number;
  eta?: bigint;
}

class FakeChain {
  latestBlock = 100n;
  balance = 10n ** 18n; // 1 ETH
  /** block number → timestamp (seconds) */
  blockTimestamps = new Map<bigint, bigint>();
  /** proposalId → on-chain state */
  proposals = new Map<bigint, FakeProposalChainState>();
  /** args recorded from getContractEvents calls */
  eventQueries: { fromBlock: bigint; toBlock: bigint }[] = [];
  /** events returned by the next getContractEvents call */
  pendingEvents: { args: Record<string, unknown> }[] = [];
  /** functionName of calls that were simulated */
  simulated: string[] = [];
  simulateError: Error | null = null;

  reader: KeeperChainReader = {
    getBlockNumber: async () => this.latestBlock,
    getBlock: async ({ blockNumber }: { blockNumber?: bigint } = {}) => {
      const timestamp = this.blockTimestamps.get(blockNumber ?? -1n);
      if (timestamp === undefined) {
        throw new Error(`no timestamp configured for block ${blockNumber}`);
      }
      return { timestamp } as Awaited<
        ReturnType<KeeperChainReader["getBlock"]>
      >;
    },
    getContractEvents: async (params: {
      fromBlock?: unknown;
      toBlock?: unknown;
    }) => {
      this.eventQueries.push({
        fromBlock: params.fromBlock as bigint,
        toBlock: params.toBlock as bigint,
      });
      const events = this.pendingEvents;
      this.pendingEvents = [];
      return events as Awaited<
        ReturnType<KeeperChainReader["getContractEvents"]>
      >;
    },
    readContract: async (params: {
      functionName: string;
      args?: readonly unknown[];
    }) => {
      const proposalId = params.args?.[0] as bigint;
      const proposal = this.proposals.get(proposalId);
      if (!proposal) throw new Error(`unknown proposal ${proposalId}`);
      if (params.functionName === "state") return proposal.state;
      if (params.functionName === "proposalEta") return proposal.eta ?? 0n;
      throw new Error(`unexpected readContract ${params.functionName}`);
    },
    simulateContract: async (params: { functionName: string }) => {
      if (this.simulateError) throw this.simulateError;
      this.simulated.push(params.functionName);
      return {} as Awaited<ReturnType<KeeperChainReader["simulateContract"]>>;
    },
    getBalance: async () => this.balance,
    waitForTransactionReceipt: async () =>
      ({ status: "success" }) as Awaited<
        ReturnType<KeeperChainReader["waitForTransactionReceipt"]>
      >,
  } as unknown as KeeperChainReader;
}

class FakeStorage implements KeeperStorage {
  cursor: bigint | null = null;
  proposals = new Map<string, TrackedProposal>();

  async getCursor(): Promise<bigint | null> {
    return this.cursor;
  }
  async setCursor(block: bigint): Promise<void> {
    this.cursor = block;
  }
  async putProposal(proposal: TrackedProposal): Promise<void> {
    this.proposals.set(proposal.proposalId, proposal);
  }
  async listProposals(): Promise<TrackedProposal[]> {
    return [...this.proposals.values()];
  }
  async removeProposal(proposalId: string): Promise<void> {
    this.proposals.delete(proposalId);
  }
}

class FakeSigner implements RelayerSigner {
  sent: { to: Address; data: Hex }[] = [];
  error: Error | null = null;

  async getAddress(): Promise<Address> {
    return RELAYER;
  }
  async sendTransaction(tx: { to: Address; data: Hex }): Promise<Hash> {
    if (this.error) throw this.error;
    this.sent.push(tx);
    return "0xtxhash" as Hash;
  }
}

/** A tracked proposal already persisted in storage, as if discovered earlier. */
function trackedProposal(
  overrides: Partial<TrackedProposal> = {},
): TrackedProposal {
  return {
    proposalId: "1",
    targets: [TARGET],
    values: ["0"],
    calldatas: ["0x"],
    descriptionHash: keccak256(toBytes("a proposal")),
    endBlock: "90",
    ...overrides,
  };
}

function createdEvent(overrides: Record<string, unknown> = {}) {
  return {
    args: {
      proposalId: 1n,
      targets: [TARGET],
      values: [0n],
      calldatas: ["0x" as Hex],
      description: "a proposal",
      endBlock: 90n,
      ...overrides,
    },
  };
}

let chain: FakeChain;
let storage: FakeStorage;
let signer: FakeSigner;
let service: ProposalLifecycleService;

beforeEach(() => {
  chain = new FakeChain();
  storage = new FakeStorage();
  signer = new FakeSigner();
  service = new ProposalLifecycleService(
    chain.reader,
    signer,
    storage,
    {
      governorAddress: GOVERNOR,
      startBlock: START_BLOCK,
      queueDelaySeconds: QUEUE_DELAY,
      executionDelaySeconds: EXECUTION_DELAY,
      minBalanceWei: MIN_BALANCE,
    },
    () => NOW,
    silentLogger,
  );
});

describe("queueing", () => {
  it("queues a succeeded proposal once the queue delay has passed", async () => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state: ProposalState.Succeeded });
    // voting ended exactly queueDelay ago
    chain.blockTimestamps.set(90n, BigInt(NOW - QUEUE_DELAY));

    await service.tick();

    expect(chain.simulated).toEqual(["queue"]);
    expect(signer.sent).toEqual([
      {
        to: GOVERNOR,
        data: encodeFunctionData({
          abi: governorAbi,
          functionName: "queue",
          args: [[TARGET], [0n], ["0x"], keccak256(toBytes("a proposal"))],
        }),
      },
    ]);
  });

  it("does not queue before the queue delay has passed", async () => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state: ProposalState.Succeeded });
    chain.blockTimestamps.set(90n, BigInt(NOW - QUEUE_DELAY + 1));

    await service.tick();

    expect(signer.sent).toEqual([]);
  });
});

describe("execution", () => {
  it("executes a queued proposal once eta plus the execution delay has passed", async () => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, {
      state: ProposalState.Queued,
      eta: BigInt(NOW - EXECUTION_DELAY),
    });

    await service.tick();

    expect(chain.simulated).toEqual(["execute"]);
    expect(signer.sent).toEqual([
      {
        to: GOVERNOR,
        data: encodeFunctionData({
          abi: governorAbi,
          functionName: "execute",
          args: [[TARGET], [0n], ["0x"], keccak256(toBytes("a proposal"))],
        }),
      },
    ]);
  });

  it("does not execute before eta plus the execution delay", async () => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, {
      state: ProposalState.Queued,
      eta: BigInt(NOW - EXECUTION_DELAY + 1),
    });

    await service.tick();

    expect(signer.sent).toEqual([]);
  });
});

describe("untracking", () => {
  it.each([
    ["canceled", ProposalState.Canceled],
    ["defeated", ProposalState.Defeated],
    ["expired", ProposalState.Expired],
    ["executed", ProposalState.Executed],
  ])("stops tracking a %s proposal", async (_label, state) => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state });

    await service.tick();

    expect(await storage.listProposals()).toEqual([]);
    expect(signer.sent).toEqual([]);
  });

  it("keeps tracking pending and active proposals", async () => {
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state: ProposalState.Pending });

    await service.tick();

    expect(await storage.listProposals()).toEqual([trackedProposal()]);
  });
});

describe("safety", () => {
  it("skips broadcasting when the relayer balance is below the minimum", async () => {
    chain.balance = MIN_BALANCE - 1n;
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state: ProposalState.Succeeded });
    chain.blockTimestamps.set(90n, BigInt(NOW - QUEUE_DELAY));

    await service.tick();

    expect(chain.simulated).toEqual([]);
    expect(signer.sent).toEqual([]);
    // still tracked — retried once the wallet is topped up
    expect(await storage.listProposals()).toEqual([trackedProposal()]);
  });

  it("does not broadcast when simulation reverts, and keeps tracking", async () => {
    chain.simulateError = new Error("execution reverted");
    await storage.putProposal(trackedProposal());
    chain.proposals.set(1n, { state: ProposalState.Succeeded });
    chain.blockTimestamps.set(90n, BigInt(NOW - QUEUE_DELAY));

    await service.tick();

    expect(signer.sent).toEqual([]);
    expect(await storage.listProposals()).toEqual([trackedProposal()]);
  });

  it("processes remaining proposals when one fails", async () => {
    chain.simulateError = null;
    await storage.putProposal(trackedProposal({ proposalId: "1" }));
    await storage.putProposal(trackedProposal({ proposalId: "2" }));
    // proposal 1 blows up on the state read; proposal 2 should still be executed
    chain.proposals.set(2n, {
      state: ProposalState.Queued,
      eta: BigInt(NOW - EXECUTION_DELAY),
    });

    await service.tick();

    expect(chain.simulated).toEqual(["execute"]);
    expect(signer.sent).toHaveLength(1);
  });
});

describe("discovery", () => {
  it("tracks proposals from ProposalCreated events and advances the cursor", async () => {
    chain.pendingEvents = [createdEvent()];
    chain.proposals.set(1n, { state: ProposalState.Active });

    await service.tick();

    expect(chain.eventQueries).toEqual([
      { fromBlock: START_BLOCK, toBlock: 100n },
    ]);
    expect(await storage.listProposals()).toEqual([trackedProposal()]);
    expect(storage.cursor).toBe(101n);
  });

  it("splits log scans into chunks of maxBlockRange", async () => {
    service = new ProposalLifecycleService(
      chain.reader,
      signer,
      storage,
      {
        governorAddress: GOVERNOR,
        startBlock: START_BLOCK,
        queueDelaySeconds: QUEUE_DELAY,
        executionDelaySeconds: EXECUTION_DELAY,
        minBalanceWei: MIN_BALANCE,
        maxBlockRange: 20n,
      },
      () => NOW,
      silentLogger,
    );
    chain.latestBlock = 100n; // 51 blocks from START_BLOCK (50) inclusive

    await service.tick();

    expect(chain.eventQueries).toEqual([
      { fromBlock: 50n, toBlock: 69n },
      { fromBlock: 70n, toBlock: 89n },
      { fromBlock: 90n, toBlock: 100n },
    ]);
    expect(storage.cursor).toBe(101n);
  });

  it("resumes scanning from the stored cursor", async () => {
    storage.cursor = 80n;

    await service.tick();

    expect(chain.eventQueries).toEqual([{ fromBlock: 80n, toBlock: 100n }]);
  });

  it("does not scan when the cursor is ahead of the chain head", async () => {
    storage.cursor = 101n;
    chain.latestBlock = 100n;

    await service.tick();

    expect(chain.eventQueries).toEqual([]);
    expect(storage.cursor).toBe(101n);
  });
});
