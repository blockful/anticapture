import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import {
  type Address,
  type Hex,
  createPublicClient,
  http,
  parseEther,
} from "viem";
import { mainnet } from "viem/chains";

import { governorAbi, ProposalState } from "@/abi/governor";
import { createLogger } from "@anticapture/observability";
import { relayProposal } from "@/controllers/relay-proposal";
import { RelayError } from "@/errors";
import { ViemGovernorGateway } from "@/services/chain/governor-gateway";
import { ProposalEnactmentService } from "@/services/proposals/proposal-enactment";
import type {
  ProposalArgs,
  ProposalSource,
} from "@/services/proposals/proposal-source";
import { createLocalSigner } from "@/signer/local-signer";

import {
  GOVERNOR_ADDRESS,
  RELAYER_ADDRESS,
  RELAYER_KEY,
  startAnvil,
  stopAnvil,
  createClients,
} from "./helpers";
import { EXECUTED_PROPOSAL } from "./fixtures/executed-proposal";

const silentLogger = createLogger("relay-proposal-e2e");
silentLogger.level = "silent";

// Fork one block before the proposal's real ProposalQueued tx: voting is
// over, nobody has queued yet, so the governor reports Succeeded and the
// endpoints can replay the queue -> execute lifecycle from scratch.
const FORK_BLOCK_SUCCEEDED = Number(EXECUTED_PROPOSAL.queuedBlock) - 1;

const PROPOSAL_ID = EXECUTED_PROPOSAL.proposalId;

// The stub serves the fixture the way the Anticapture API would; the
// service's hashProposal verification proves the args are genuine.
const PROPOSAL_ARGS: ProposalArgs = {
  targets: [...EXECUTED_PROPOSAL.targets] as Address[],
  values: EXECUTED_PROPOSAL.values.map(BigInt),
  calldatas: [...EXECUTED_PROPOSAL.calldatas] as Hex[],
  description: EXECUTED_PROPOSAL.description,
};

class StubProposalSource implements ProposalSource {
  proposals = new Map<string, ProposalArgs>([[PROPOSAL_ID, PROPOSAL_ARGS]]);
  async getProposal(proposalId: string): Promise<ProposalArgs | null> {
    return this.proposals.get(proposalId) ?? null;
  }
}

type TestClient = ReturnType<typeof createClients>["testClient"];

function createProposalApp(rpcUrl: string) {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl, { timeout: 30_000 }),
  });
  const signer = createLocalSigner(RELAYER_KEY, mainnet, rpcUrl);

  const service = new ProposalEnactmentService(
    new ViemGovernorGateway(publicClient, GOVERNOR_ADDRESS),
    signer,
    new StubProposalSource(),
    {
      governorAddress: GOVERNOR_ADDRESS,
      minBalanceWei: parseEther("0.1").valueOf(),
    },
    silentLogger,
  );

  const app = new Hono();
  app.onError((err, c) => {
    if (err instanceof RelayError) {
      return c.json({ error: err.message, code: err.code }, err.status as 400);
    }
    return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
  });
  relayProposal(app, service);
  return app;
}

async function post(
  app: ReturnType<typeof createProposalApp>,
  path: string,
  proposalId: string,
) {
  const response = await app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId }),
  });
  const body = (await response.json()) as {
    transactionHash?: string;
    code?: string;
    error?: string;
  };
  return { status: response.status, body };
}

describe("POST /relay/queue + /relay/execute", () => {
  let rpcUrl: string;
  let testClient: TestClient;
  let app: ReturnType<typeof createProposalApp>;

  beforeAll(async () => {
    rpcUrl = await startAnvil({ forkBlockNumber: FORK_BLOCK_SUCCEEDED });
    testClient = createClients(rpcUrl).testClient;

    await testClient.setBalance({
      address: RELAYER_ADDRESS,
      value: parseEther("10"),
    });

    expect(await proposalState()).toBe(ProposalState.Succeeded);
  }, 120_000);

  afterAll(async () => {
    await stopAnvil();
  });

  async function proposalState(): Promise<number> {
    return testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "state",
      args: [BigInt(PROPOSAL_ID)],
    });
  }

  it("returns 404 for a proposal the API does not know", async () => {
    app = createProposalApp(rpcUrl);

    const { status, body } = await post(app, "/relay/queue", "999");

    expect(status).toBe(404);
    expect(body).toMatchObject({ code: "PROPOSAL_NOT_FOUND" });
  });

  it("queues a succeeded proposal, then executes it after the timelock", async () => {
    app = createProposalApp(rpcUrl);

    // Execute before queue: wrong state.
    const early = await post(app, "/relay/execute", PROPOSAL_ID);
    expect(early.status).toBe(409);
    expect(early.body).toMatchObject({ code: "INVALID_PROPOSAL_STATE" });

    // Queue.
    const queued = await post(app, "/relay/queue", PROPOSAL_ID);
    expect(queued.status).toBe(200);
    expect(queued.body.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(await proposalState()).toBe(ProposalState.Queued);

    // Queue again: no longer Succeeded.
    const requeued = await post(app, "/relay/queue", PROPOSAL_ID);
    expect(requeued.status).toBe(409);
    expect(requeued.body).toMatchObject({ code: "INVALID_PROPOSAL_STATE" });

    // Execute before the eta: timelock not ready.
    const premature = await post(app, "/relay/execute", PROPOSAL_ID);
    expect(premature.status).toBe(409);
    expect(premature.body).toMatchObject({ code: "TIMELOCK_NOT_READY" });

    // Cross the timelock eta on-chain.
    const eta = await testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "proposalEta",
      args: [BigInt(PROPOSAL_ID)],
    });
    const { timestamp } = await testClient.getBlock();
    await testClient.increaseTime({ seconds: Number(eta - timestamp) + 60 });
    await testClient.mine({ blocks: 1 });

    // Execute.
    const executed = await post(app, "/relay/execute", PROPOSAL_ID);
    expect(executed.status).toBe(200);
    expect(executed.body.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(await proposalState()).toBe(ProposalState.Executed);
  }, 120_000);
});
