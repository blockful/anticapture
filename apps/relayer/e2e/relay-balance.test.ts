import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Hex, parseEther } from "viem";
import { z } from "zod";

import { BalanceResponseSchema } from "@/schemas/balance";

import {
  RELAYER_ADDRESS,
  createClients,
  createTestApp,
  startAnvil,
  stopAnvil,
} from "./helpers";

type BalanceBody = z.infer<typeof BalanceResponseSchema>;
type TestClient = ReturnType<typeof createClients>["testClient"];

const THRESHOLD_WEI = parseEther("0.1");

describe("GET /relay/balance", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let testClient: TestClient;
  let snapshotId: Hex;

  beforeAll(async () => {
    const rpcUrl = await startAnvil();
    testClient = createClients(rpcUrl).testClient;
    app = await createTestApp(rpcUrl, THRESHOLD_WEI);
  }, 60_000);

  afterAll(async () => {
    await stopAnvil();
  });

  beforeEach(async () => {
    snapshotId = await testClient.snapshot();
    return async () => {
      await testClient.revert({ id: snapshotId });
    };
  });

  it("reports hasEnoughBalance=true when wallet balance is at or above the threshold", async () => {
    await testClient.setBalance({
      address: RELAYER_ADDRESS,
      value: THRESHOLD_WEI,
    });

    const res = await app.request("/relay/balance");
    const body = (await res.json()) as BalanceBody;

    expect(res.status).toBe(200);
    expect(body.hasEnoughBalance).toBe(true);
    expect(body.balanceWei).toBe(THRESHOLD_WEI.toString());
    expect(body.thresholdWei).toBe(THRESHOLD_WEI.toString());
  });

  it("reports hasEnoughBalance=false when wallet balance is below the threshold", async () => {
    await testClient.setBalance({
      address: RELAYER_ADDRESS,
      value: THRESHOLD_WEI - 1n,
    });

    const res = await app.request("/relay/balance");
    const body = (await res.json()) as BalanceBody;

    expect(res.status).toBe(200);
    expect(body.hasEnoughBalance).toBe(false);
    expect(body.balanceWei).toBe((THRESHOLD_WEI - 1n).toString());
    expect(body.thresholdWei).toBe(THRESHOLD_WEI.toString());
  });
});
