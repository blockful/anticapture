import { describe, expect, it } from "vitest";

import { redactUrl } from "./upstream-error";

describe("redactUrl", () => {
  it("keeps origin and path of an absolute URL and drops the query", () => {
    expect(redactUrl("https://api.dune.com/v1/query/1/results?api_key=x")).toBe(
      "https://api.dune.com/v1/query/1/results",
    );
  });

  it("keeps the path of a relative axios path and drops the query", () => {
    // Every provider passes paths relative to its client's base URL.
    expect(
      redactUrl("/coins/uniswap/market_chart?vs_currency=usd&days=7"),
    ).toBe("/coins/uniswap/market_chart");
    expect(redactUrl("/")).toBe("/");
  });

  it("falls back to a placeholder for something that is not a URL at all", () => {
    expect(redactUrl("http://")).toBe("(unparseable url)");
  });
});
