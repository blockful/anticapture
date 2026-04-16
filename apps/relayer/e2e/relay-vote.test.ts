import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import {
  type Address,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
  parseEventLogs,
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";
import { z } from "zod";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { RelayVoteResponseSchema } from "@/schemas/relay-vote";

import {
  TOKEN_ADDRESS,
  GOVERNOR_ADDRESS,
  RELAYER_ADDRESS,
  TEST_USER_KEY,
  TEST_USER_ADDRESS,
  BROKE_USER_KEY,
  PROPOSER_ADDRESS,
  WHALE_ADDRESS,
  DEAD_ADDRESS,
  startAnvil,
  stopAnvil,
  createTestApp,
  createClients,
  signVote,
} from "./helpers";

type SuccessBody = z.infer<typeof RelayVoteResponseSchema>;
type TestClient = ReturnType<typeof createClients>["testClient"];

// --- beforeAll step helpers ---

async function fundRelayer(testClient: TestClient): Promise<void> {
  await testClient.setBalance({
    address: RELAYER_ADDRESS,
    value: parseEther("10"),
  });
}

async function fundFromWhale(
  testClient: TestClient,
  rpcUrl: string,
  recipient: Address,
  amount: bigint,
): Promise<void> {
  await testClient.impersonateAccount({ address: WHALE_ADDRESS });
  const whale = createWalletClient({
    account: WHALE_ADDRESS,
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await whale.sendTransaction({
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

/**
 * Self-delegates from an anvil dev account (unlocked by default, so we can use
 * `json-rpc` account type without private keys).
 */
async function selfDelegate(
  testClient: TestClient,
  rpcUrl: string,
  account: Address,
): Promise<void> {
  const wallet = createWalletClient({
    account: { address: account, type: "json-rpc" },
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await wallet.writeContract({
    address: TOKEN_ADDRESS,
    abi: erc20VotesAbi,
    functionName: "delegate",
    args: [account],
  });
  await testClient.waitForTransactionReceipt({ hash });
  await testClient.mine({ blocks: 1 });
}

/** Submits a no-op proposal (zero-value transfer to 0xdead) and returns the proposalId. */
async function createNoOpProposal(
  testClient: TestClient,
  rpcUrl: string,
  proposer: Address,
): Promise<bigint> {
  const wallet = createWalletClient({
    account: { address: proposer, type: "json-rpc" },
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await wallet.writeContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "propose",
    args: [
      [TOKEN_ADDRESS],
      [0n],
      [
        encodeFunctionData({
          abi: erc20VotesAbi,
          functionName: "transfer",
          args: [DEAD_ADDRESS, 0n],
        }),
      ],
      "e2e relay-vote test proposal",
    ],
  });
  const receipt = await testClient.waitForTransactionReceipt({ hash });
  const [proposalCreated] = parseEventLogs({
    abi: governorAbi,
    eventName: "ProposalCreated",
    logs: receipt.logs,
  });
  if (!proposalCreated) {
    throw new Error("ProposalCreated event not found in propose() receipt");
  }
  return proposalCreated.args.proposalId;
}

/**
 * Mines past `votingDelay` so the proposal becomes Active, then asserts the
 * state machine is where we expect. Returns `votingPeriod` so tests can roll
 * past the deadline when needed.
 */
async function activateProposal(
  testClient: TestClient,
  proposalId: bigint,
): Promise<{ votingPeriod: bigint }> {
  const [votingDelay, votingPeriod] = await Promise.all([
    testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "votingDelay",
    }),
    testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "votingPeriod",
    }),
  ]);
  await testClient.mine({ blocks: Number(votingDelay) + 1 });

  const state = await testClient.readContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "state",
    args: [proposalId],
  });
  if (state !== ProposalState.Active) {
    throw new Error(
      `Expected proposal to be Active, got state=${state} (proposalId=${proposalId})`,
    );
  }

  return { votingPeriod };
}

describe("POST /relay/vote", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let rpcUrl: string;
  let testClient: TestClient;
  let snapshotId: Hex;
  let proposalId: bigint;
  let votingPeriod: bigint;

  beforeAll(async () => {
    rpcUrl = await startAnvil();
    testClient = createClients(rpcUrl).testClient;

    await fundRelayer(testClient);

    // Test user: 10K ENS (clears MIN_VOTING_POWER).
    // Proposer:  250K ENS (clears ENS's 100K proposal threshold with buffer).
    await fundFromWhale(
      testClient,
      rpcUrl,
      TEST_USER_ADDRESS,
      parseUnits("10000", 18),
    );
    await fundFromWhale(
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
    ({ votingPeriod } = await activateProposal(testClient, proposalId));

    app = await createTestApp(rpcUrl);
  }, 60_000);

  afterAll(async () => {
    await stopAnvil();
  });

  beforeEach(async () => {
    snapshotId = await testClient.snapshot();
  });

  afterEach(async () => {
    await testClient.revert({ id: snapshotId });
  });

  it("should relay a valid vote and flip hasVoted on-chain", async () => {
    const body = await signVote({
      privateKey: TEST_USER_KEY,
      proposalId,
      support: 1,
    });

    const res = await app.request("/relay/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody = (await res.json()) as SuccessBody;

    expect(res.status).toBe(200);
    expect(responseBody.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(responseBody.voter.toLowerCase()).toBe(
      TEST_USER_ADDRESS.toLowerCase(),
    );

    await testClient.waitForTransactionReceipt({
      hash: responseBody.transactionHash,
    });
    const hasVoted = await testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "hasVoted",
      args: [proposalId, TEST_USER_ADDRESS],
    });
    expect(hasVoted).toBe(true);
  });

  it("should reject a vote from an address with insufficient voting power", async () => {
    const body = await signVote({
      privateKey: BROKE_USER_KEY,
      proposalId,
      support: 1,
    });

    const res = await app.request("/relay/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      code: "INSUFFICIENT_VOTING_POWER",
    });
  });

  it("should reject a vote when the proposal is no longer active", async () => {
    // Roll the chain past the voting deadline → proposal state becomes Defeated
    await testClient.mine({ blocks: Number(votingPeriod) + 1 });

    const body = await signVote({
      privateKey: TEST_USER_KEY,
      proposalId,
      support: 1,
    });

    const res = await app.request("/relay/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "PROPOSAL_NOT_ACTIVE" });
  });

  it("should reject a second vote from the same address on the same proposal", async () => {
    const body = await signVote({
      privateKey: TEST_USER_KEY,
      proposalId,
      support: 1,
    });

    const firstRes = await app.request("/relay/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(firstRes.status).toBe(200);

    const firstBody = (await firstRes.json()) as SuccessBody;
    await testClient.waitForTransactionReceipt({
      hash: firstBody.transactionHash,
    });

    const secondRes = await app.request("/relay/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(secondRes.status).toBe(400);
    expect(await secondRes.json()).toMatchObject({ code: "ALREADY_VOTED" });
  });
});
