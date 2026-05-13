import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { type Hex, parseEther, parseUnits } from "viem";
import { z } from "zod";

import { governorAbi } from "@/abi/governor";
import { RelayVoteResponseSchema } from "@/schemas/relay-vote";

import {
  GOVERNOR_ADDRESS,
  RELAYER_ADDRESS,
  TEST_USER_KEY,
  TEST_USER_ADDRESS,
  BROKE_USER_KEY,
  PROPOSER_ADDRESS,
  startAnvil,
  stopAnvil,
  createTestApp,
  createClients,
  signVote,
  fundFromWhale,
  selfDelegate,
  createNoOpProposal,
  activateProposal,
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

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ code: "INTERNAL" });
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

    expect(secondRes.status).toBe(500);
    expect(await secondRes.json()).toMatchObject({ code: "INTERNAL" });
  });
});
