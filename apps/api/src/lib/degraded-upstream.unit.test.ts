import { afterEach, describe, expect, it } from "vitest";

import { recordDegradedUpstream } from "./degraded-upstream";
import {
  captureDegradedUpstream,
  type DegradedUpstreamCapture,
} from "./degraded-upstream.test-support";

describe("recordDegradedUpstream", () => {
  let capture: DegradedUpstreamCapture | undefined;
  afterEach(() => capture?.restore());

  it("records the upstream, resource and mode of each fallback", () => {
    capture = captureDegradedUpstream();

    recordDegradedUpstream({
      upstream: "dune",
      resource: "revenue_actions",
      mode: "stale",
      error: new Error("Dune is down"),
    });
    recordDegradedUpstream({
      upstream: "coingecko",
      resource: "token_historical_prices",
      mode: "empty",
    });

    expect(capture.recorded()).toEqual([
      { upstream: "dune", resource: "revenue_actions", mode: "stale" },
      {
        upstream: "coingecko",
        resource: "token_historical_prices",
        mode: "empty",
      },
    ]);
  });
});
