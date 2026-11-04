import { describe, expect, it } from "vitest";

import {
  createObservabilityProvider,
  PrometheusSerializer,
} from "@anticapture/observability";

import type { RelayerStatusResponse } from "@/schemas/status";

import { registerStatusMetrics } from "./status-metrics";

const scrape = async (status: RelayerStatusResponse): Promise<string> => {
  const { exporter, meterProvider } = createObservabilityProvider(
    "status-metrics-test",
  );
  registerStatusMetrics(
    meterProvider.getMeter("status-metrics-test"),
    { getStatus: async () => status },
    "ens",
  );
  const result = await exporter.collect();
  return new PrometheusSerializer().serialize(result.resourceMetrics);
};

describe("registerStatusMetrics", () => {
  it("reports an available relayer as 1 with no reasons", async () => {
    const text = await scrape({
      available: true,
      reasons: [],
      checkedAt: "2026-10-24T12:00:00.000Z",
    });

    expect(text).toMatch(/relayer_gasless_available\{dao="ens"\} 1/);
    expect(text).not.toMatch(/relayer_gasless_unavailable_reason\{/);
  });

  it("reports an unavailable relayer as 0 with one series per reason", async () => {
    const text = await scrape({
      available: false,
      reasons: ["LOW_BALANCE", "RPC_UNAVAILABLE"],
      checkedAt: "2026-10-24T12:00:00.000Z",
    });

    expect(text).toMatch(/relayer_gasless_available\{dao="ens"\} 0/);
    expect(text).toMatch(
      /relayer_gasless_unavailable_reason\{dao="ens",reason="LOW_BALANCE"\} 1/,
    );
    expect(text).toMatch(
      /relayer_gasless_unavailable_reason\{dao="ens",reason="RPC_UNAVAILABLE"\} 1/,
    );
  });
});
