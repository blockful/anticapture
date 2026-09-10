import { describe, it, expect } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createLogger } from "@anticapture/observability";

import { Errors } from "@/errors";
import type { EnactOutcome } from "@/services/proposals/proposal-enactment";

import { relayWebhook, type WebhookOutcome } from "./relay-webhook";

const silentLogger = createLogger("relay-webhook-test");
silentLogger.level = "silent";

const TX_HASH = `0x${"ab".repeat(32)}` as const;

function createApp(
  enact: (proposalId: string) => Promise<EnactOutcome>,
  extraOptions: { daoId?: string } = {},
) {
  const app = new Hono();
  const calls: string[] = [];
  const outcomes: WebhookOutcome[] = [];
  relayWebhook(
    app,
    {
      enact: async (id) => {
        calls.push(id);
        return enact(id);
      },
    },
    {
      onOutcome: (o) => outcomes.push(o),
      logger: silentLogger,
      ...extraOptions,
    },
  );
  return { app, calls, outcomes };
}

const post = (app: Hono, body: unknown) =>
  app.request("/internal/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

// The route answers before enact() settles; give the microtask queue a turn.
const settle = () => new Promise((r) => setTimeout(r, 0));

const webhookBody = (metadata: Record<string, unknown>) => ({
  event: "proposalExecutable",
  message: "Proposal 42 on ENS is ready to execute",
  timestamp: new Date().toISOString(),
  metadata,
});

describe("POST /internal/webhook", () => {
  it("accepts a proposal id and enacts it asynchronously", async () => {
    const { app, calls, outcomes } = createApp(async () => ({
      action: "execute",
      txHash: TX_HASH,
    }));

    const res = await post(
      app,
      webhookBody({ proposalId: "42", status: "PENDING_EXECUTION" }),
    );

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ accepted: true });
    await settle();
    expect(calls).toEqual(["42"]);
    expect(outcomes).toEqual(["executed"]);
  });

  it("reports queued when enact queued", async () => {
    const { app, outcomes } = createApp(async () => ({
      action: "queue",
      txHash: TX_HASH,
    }));
    await post(app, webhookBody({ proposalId: "42" }));
    await settle();
    expect(outcomes).toEqual(["queued"]);
  });

  it("ignores events without a proposal id and never calls enact", async () => {
    const { app, calls, outcomes } = createApp(async () => ({
      action: "skipped",
      state: "Executed",
    }));

    const res = await post(
      app,
      webhookBody({ triggerType: "newProposal", daoId: "ens" }),
    );

    expect(res.status).toBe(202);
    await settle();
    expect(calls).toEqual([]);
    expect(outcomes).toEqual(["ignored"]);
  });

  it("ignores a malformed proposal id", async () => {
    const { app, calls, outcomes } = createApp(async () => ({
      action: "skipped",
      state: "Executed",
    }));

    const res = await post(app, webhookBody({ proposalId: "not-a-number" }));

    expect(res.status).toBe(202);
    await settle();
    expect(calls).toEqual([]);
    expect(outcomes).toEqual(["ignored"]);
  });

  it("ignores a non-JSON body", async () => {
    const { app, calls, outcomes } = createApp(async () => ({
      action: "skipped",
      state: "Executed",
    }));

    const res = await app.request("/internal/webhook", {
      method: "POST",
      body: "nope",
    });

    expect(res.status).toBe(202);
    await settle();
    expect(calls).toEqual([]);
    expect(outcomes).toEqual(["ignored"]);
  });

  it("reports skipped when the proposal is not actionable", async () => {
    const { app, outcomes } = createApp(async () => ({
      action: "skipped",
      state: "Executed",
    }));
    await post(app, webhookBody({ proposalId: "42" }));
    await settle();
    expect(outcomes).toEqual(["skipped"]);
  });

  it("reports skipped on a 409 from enact (timelock, simulation)", async () => {
    const { app, outcomes } = createApp(async () => {
      throw Errors.TIMELOCK_NOT_READY(1n);
    });
    const res = await post(app, webhookBody({ proposalId: "42" }));
    expect(res.status).toBe(202);
    await settle();
    expect(outcomes).toEqual(["skipped"]);
  });

  it("reports failed on any other error and still answered 202", async () => {
    const { app, outcomes } = createApp(async () => {
      throw new Error("rpc down");
    });
    const res = await post(app, webhookBody({ proposalId: "42" }));
    expect(res.status).toBe(202);
    await settle();
    expect(outcomes).toEqual(["failed"]);
  });

  it("reports failed on TRANSACTION_REVERTED (gas was spent on a mined revert)", async () => {
    const { app, outcomes } = createApp(async () => {
      throw Errors.TRANSACTION_REVERTED(TX_HASH);
    });
    const res = await post(app, webhookBody({ proposalId: "42" }));
    expect(res.status).toBe(202);
    await settle();
    expect(outcomes).toEqual(["failed"]);
  });

  it.each([
    ["PROPOSAL_NOT_FOUND (404)", () => Errors.PROPOSAL_NOT_FOUND("42")],
    ["RELAYER_LOW_BALANCE (503)", () => Errors.RELAYER_LOW_BALANCE()],
  ])("reports failed on %s", async (_name, makeError) => {
    const { app, outcomes } = createApp(async () => {
      throw makeError();
    });
    const res = await post(app, webhookBody({ proposalId: "42" }));
    expect(res.status).toBe(202);
    await settle();
    expect(outcomes).toEqual(["failed"]);
  });

  it("returns 202 before enact settles", async () => {
    let resolveEnact: (value: EnactOutcome) => void;
    const enacted = new Promise<EnactOutcome>((resolve) => {
      resolveEnact = resolve;
    });
    const { app, outcomes } = createApp(() => enacted);

    const res = await post(app, webhookBody({ proposalId: "42" }));

    expect(res.status).toBe(202);
    expect(outcomes).toEqual([]);

    resolveEnact!({ action: "execute", txHash: TX_HASH });
    await settle();
    expect(outcomes).toEqual(["executed"]);
  });

  it("ignores events for another DAO", async () => {
    const { app, calls, outcomes } = createApp(
      async () => ({ action: "execute", txHash: TX_HASH }),
      { daoId: "ENS" },
    );

    const res = await post(
      app,
      webhookBody({ proposalId: "42", daoId: "UNI" }),
    );

    expect(res.status).toBe(202);
    await settle();
    expect(calls).toEqual([]);
    expect(outcomes).toEqual(["ignored"]);
  });

  it("accepts a matching DAO regardless of case", async () => {
    const { app, calls, outcomes } = createApp(
      async () => ({ action: "execute", txHash: TX_HASH }),
      { daoId: "ENS" },
    );

    await post(app, webhookBody({ proposalId: "42", daoId: "ens" }));

    await settle();
    expect(calls).toEqual(["42"]);
    expect(outcomes).toEqual(["executed"]);
  });

  it("does not break when onOutcome throws", async () => {
    const app = new Hono();
    relayWebhook(
      app,
      { enact: async () => ({ action: "execute", txHash: TX_HASH }) },
      {
        onOutcome: () => {
          throw new Error("boom");
        },
        logger: silentLogger,
      },
    );

    const res = await post(app, webhookBody({ proposalId: "42" }));
    expect(res.status).toBe(202);
    await settle();
  });
});
