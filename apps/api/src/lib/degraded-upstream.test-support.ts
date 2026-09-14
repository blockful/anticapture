/**
 * Test-only helper for asserting on the degraded fallback counter.
 *
 * Excluded from coverage in `vitest.config.ts`; nothing under `src` should
 * import this at runtime.
 */

import { vi } from "vitest";

import { degradedUpstreamResponsesTotal } from "@/metrics";

export interface DegradedUpstreamLabels {
  upstream: string;
  resource: string;
  mode: string;
}

export interface DegradedUpstreamCapture {
  /** Label sets recorded on the counter since the capture started. */
  recorded: () => DegradedUpstreamLabels[];
  restore: () => void;
}

/**
 * Records the label sets passed to `degraded_upstream_responses_total` while
 * leaving the real counter in place. Prefer this over scraping the exporter,
 * which also collects host metrics and takes seconds per call.
 */
export const captureDegradedUpstream = (): DegradedUpstreamCapture => {
  const spy = vi.spyOn(degradedUpstreamResponsesTotal, "add");

  return {
    recorded: () =>
      spy.mock.calls.map(([, attributes]) => ({
        upstream: String(attributes?.upstream),
        resource: String(attributes?.resource),
        mode: String(attributes?.mode),
      })),
    restore: () => spy.mockRestore(),
  };
};
