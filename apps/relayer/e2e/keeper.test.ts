import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  type Address,
  createTestClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
  parseUnits,
  publicActions,
} from "viem";
import { mainnet } from "viem/chains";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { createLogger } from "@anticapture/observability";
import { createLocalSigner } from "@/signer/local-signer";
import {
  ProposalLifecycleService,
  type KeeperStorage,
  type TrackedProposal,
} from "@/services/keeper/proposal-lifecycle";

import {
  FORK_BLOCK,
  GOVERNOR_ADDRESS,
  PROPOSER_ADDRESS,
  RELAYER_ADDRESS,
  RELAYER_KEY,
  TEST_USER_ADDRESS,
  TOKEN_ADDRESS,
  startAnvil,
  stopAnvil,
  createClients,
  selfDelegate,
  createNoOpProposal,
  activateProposal,
} from "./helpers";

const silentLogger = createLogger("keeper-e2e");
silentLogger.level = "silent";

// ENS quorum is 1% of supply (1M ENS); vote with buffer above it. The shared
// WHALE (a Binance hot wallet) can't cover this, so quorum-scale funding comes
// from the ENS DAO timelock, which has held several million ENS since launch.
const ENS_TIMELOCK: Address = "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7";
const QUORUM_VOTES = parseUnits("1200000", 18);

class InMemoryKeeperStorage implements KeeperStorage {
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

type TestClient = ReturnType<typeof createClients>["testClient"];

/**
 * Like createClients().testClient, but with a 60s transport timeout: this
 * suite mines a whole voting period, and big anvil_mine batches on a fork
 * outlive viem's default 10s.
 */
function createPatientTestClient(rpcUrl: string): TestClient {
  return createTestClient({
    mode: "anvil",
    transport: http(rpcUrl, { timeout: 60_000 }),
    chain: mainnet,
  }).extend(publicActions);
}

/** Mines in chunks so no single anvil_mine call outlives the HTTP timeout. */
async function mineBlocks(
  testClient: TestClient,
  blocks: number,
): Promise<void> {
  const CHUNK = 5_000;
  for (let mined = 0; mined < blocks; mined += CHUNK) {
    await testClient.mine({ blocks: Math.min(CHUNK, blocks - mined) });
  }
}

async function fundFromTimelock(
  testClient: TestClient,
  rpcUrl: string,
  recipient: Address,
  amount: bigint,
): Promise<void> {
  await testClient.setBalance({
    address: ENS_TIMELOCK,
    value: parseEther("1"),
  });
  await testClient.impersonateAccount({ address: ENS_TIMELOCK });
  const timelock = createWalletClient({
    account: ENS_TIMELOCK,
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await timelock.sendTransaction({
    to: TOKEN_ADDRESS,
    data: encodeFunctionData({
      abi: erc20VotesAbi,
      functionName: "transfer",
      args: [recipient, amount],
    }),
  });
  await testClient.waitForTransactionReceipt({ hash });
  await testClient.mine({ blocks: 1 });
}

async function castVoteFor(
  testClient: TestClient,
  rpcUrl: string,
  proposalId: bigint,
): Promise<void> {
  const wallet = createWalletClient({
    account: { address: TEST_USER_ADDRESS, type: "json-rpc" },
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await wallet.writeContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "castVote",
    args: [proposalId, 1],
  });
  await testClient.waitForTransactionReceipt({ hash });
  await testClient.mine({ blocks: 1 });
}

async function proposalState(
  testClient: TestClient,
  proposalId: bigint,
): Promise<number> {
  return testClient.readContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "state",
    args: [proposalId],
  });
}

describe("proposal lifecycle keeper", () => {
  let rpcUrl: string;
  let testClient: TestClient;
  let proposalId: bigint;
  let keeper: ProposalLifecycleService;
  let storage: InMemoryKeeperStorage;

  beforeAll(async () => {
    rpcUrl = await startAnvil();
    testClient = createPatientTestClient(rpcUrl);

    await testClient.setBalance({
      address: RELAYER_ADDRESS,
      value: parseEther("10"),
    });

    // Voter: enough ENS to clear the 1M quorum on its own.
    // Proposer: clears ENS's 100K proposal threshold with buffer.
    await fundFromTimelock(testClient, rpcUrl, TEST_USER_ADDRESS, QUORUM_VOTES);
    await fundFromTimelock(
      testClient,
      rpcUrl,
      PROPOSER_ADDRESS,
      parseUnits("250000", 18),
    );

    // Self-delegate BEFORE the proposal snapshot so voting-power checkpoints
    // exist at the snapshot block.
    await selfDelegate(testClient, rpcUrl, TEST_USER_ADDRESS);
    await selfDelegate(testClient, rpcUrl, PROPOSER_ADDRESS);

    proposalId = await createNoOpProposal(testClient, rpcUrl, PROPOSER_ADDRESS);
    const { votingPeriod } = await activateProposal(testClient, proposalId);

    // Pass the proposal: vote FOR above quorum, then mine past the deadline.
    await castVoteFor(testClient, rpcUrl, proposalId);
    await mineBlocks(testClient, Number(votingPeriod) + 1);

    expect(await proposalState(testClient, proposalId)).toBe(
      ProposalState.Succeeded,
    );

    storage = new InMemoryKeeperStorage();
    keeper = new ProposalLifecycleService(
      testClient,
      createLocalSigner(RELAYER_KEY, mainnet, rpcUrl),
      storage,
      {
        governorAddress: GOVERNOR_ADDRESS,
        startBlock: BigInt(FORK_BLOCK),
        // Delays are wall-clock; the forked chain's timestamps are far in the
        // past, so both gates pass immediately — delay gating is unit-tested.
        queueDelaySeconds: 1800,
        executionDelaySeconds: 1800,
        minBalanceWei: parseEther("0.1").valueOf(),
        // one getLogs call over the whole local range
        maxBlockRange: 1_000_000n,
      },
      undefined,
      silentLogger,
    );
    // Mining ~1 voting period (tens of thousands of blocks) on a fork is slow.
  }, 600_000);

  afterAll(async () => {
    await stopAnvil();
  });

  it("queues a succeeded proposal and executes it after the timelock", async () => {
    // Tick 1: discovers the proposal from logs and queues it.
    await keeper.tick();
    expect(await proposalState(testClient, proposalId)).toBe(
      ProposalState.Queued,
    );

    // Cross the timelock eta on-chain.
    const eta = await testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "proposalEta",
      args: [proposalId],
    });
    const { timestamp } = await testClient.getBlock();
    await testClient.increaseTime({
      seconds: Number(eta - timestamp) + 60,
    });
    await testClient.mine({ blocks: 1 });

    // Tick 2: executes.
    await keeper.tick();
    expect(await proposalState(testClient, proposalId)).toBe(
      ProposalState.Executed,
    );

    // Tick 3: executed proposals are untracked.
    await keeper.tick();
    expect(await storage.listProposals()).toEqual([]);
  }, 120_000);
});
