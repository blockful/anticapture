import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { getAddress, parseEther } from "viem";

import { createLogger } from "@anticapture/observability";

import { RelayerStatusResponseSchema } from "@/schemas/status";
import type { ChainProbe } from "@/services/chain/chain-probe";
import {
  RelayerStatusService,
  type RelayerStatusDeps,
} from "@/services/status/relayer-status";

import { status } from "./status";

const silentLogger = createLogger("status-controller-test");
silentLogger.level = "silent";

const NOW = Date.parse("2026-10-24T12:00:00.000Z");
const THRESHOLD_WEI = parseEther("0.1");

const fail = async (): Promise<never> => {
  throw new Error("unreachable");
};

const healthyChain: ChainProbe = {
  chainId: async () => 1,
  latestBlockTimestamp: async () => BigInt(NOW / 1000),
  balance: async () => parseEther("1"),
  nonce: async () => 3,
};

function createApp(overrides: Partial<RelayerStatusDeps> = {}) {
  const app = new Hono();
  status(
    app,
    new RelayerStatusService(
      {
        paused: false,
        chainId: 1,
        chain: healthyChain,
        relayerAddress: getAddress(
          "0x1111111111111111111111111111111111111111",
        ),
        thresholdWei: THRESHOLD_WEI,
        rateLimitStorage: { ping: async () => {} },
        relayOutcomes: { isFailing: () => false },
        ...overrides,
      },
      silentLogger,
    ),
  );
  return app;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /relay/status", () => {
  it("answers 200 with the status contract when the relayer can be used", async () => {
    const res = await createApp().request("/relay/status");

    expect(res.status).toBe(200);
    expect(RelayerStatusResponseSchema.parse(await res.json())).toEqual({
      available: true,
      reasons: [],
      checks: {
        paused: false,
        rpc: "ok",
        balance: "ok",
        rateLimiter: "ok",
        pendingTransactions: "ok",
        recentRelays: "ok",
      },
      balanceWei: parseEther("1").toString(),
      thresholdWei: THRESHOLD_WEI.toString(),
      checkedAt: "2026-10-24T12:00:00.000Z",
    });
  });

  it("still answers 200 when every check fails", async () => {
    const app = createApp({
      paused: true,
      chain: {
        chainId: fail,
        latestBlockTimestamp: fail,
        balance: fail,
        nonce: fail,
      },
      rateLimitStorage: { ping: fail },
      relayOutcomes: { isFailing: () => true },
    });

    const res = await app.request("/relay/status");

    expect(res.status).toBe(200);
    expect(RelayerStatusResponseSchema.parse(await res.json())).toEqual({
      available: false,
      reasons: [
        "PAUSED",
        "RPC_UNAVAILABLE",
        "BALANCE_UNKNOWN",
        "RATE_LIMITER_UNAVAILABLE",
        "RECENT_RELAY_FAILURES",
      ],
      checks: {
        paused: true,
        rpc: "unavailable",
        balance: "unknown",
        rateLimiter: "unavailable",
        pendingTransactions: "unknown",
        recentRelays: "failing",
      },
      thresholdWei: THRESHOLD_WEI.toString(),
      checkedAt: "2026-10-24T12:00:00.000Z",
    });
  });

  // The dashboard and the generated SDK are written against these names.
  it("publishes the route and its schemas under the contract names", () => {
    const doc = createApp().getOpenAPIDocument({
      openapi: "3.0.0",
      info: { title: "Anticapture Relayer", version: "1.0.0" },
    });

    expect(Object.keys(doc.components?.schemas ?? {}).sort()).toEqual([
      "RelayerStatusReason",
      "RelayerStatusResponse",
    ]);
    expect(doc.paths["/relay/status"]?.get?.operationId).toBe(
      "getRelayerStatus",
    );
  });
});
