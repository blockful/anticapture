import { describe, expect, it } from "vitest";

import { AxiosError, AxiosHeaders } from "axios";

import { describeUpstreamError, redactUrl } from "./upstream-error";

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

describe("describeUpstreamError", () => {
  it("keeps status, code and a redacted url of an axios failure and drops the config", () => {
    const headers = new AxiosHeaders({ "x-cg-demo-api-key": "secret-key" });
    const error = new AxiosError(
      "Request failed with status code 429",
      "ERR_BAD_REQUEST",
      { headers, url: "/coins/uniswap/market_chart?vs_currency=usd" },
      undefined,
      {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        config: { headers },
        data: null,
      },
    );

    const described = describeUpstreamError(error);

    expect(described).toEqual({
      name: "AxiosError",
      message: "Request failed with status code 429",
      code: "ERR_BAD_REQUEST",
      status: 429,
      url: "/coins/uniswap/market_chart",
    });
    expect(JSON.stringify(described)).not.toContain("secret-key");
  });

  it("describes a wrapped cause without carrying the raw object", () => {
    const cause = new AxiosError("timeout", "ECONNABORTED", {
      headers: new AxiosHeaders({ "X-Dune-API-Key": "dune-secret" }),
      url: "https://api.dune.com/v1/query/1/results?api_key=dune-secret",
    });
    const wrapped = new Error("Dune down", { cause });

    const described = describeUpstreamError(wrapped);

    expect(described).toEqual({
      name: "Error",
      message: "Dune down",
      cause: {
        name: "AxiosError",
        message: "timeout",
        code: "ECONNABORTED",
        url: "https://api.dune.com/v1/query/1/results",
      },
    });
    expect(JSON.stringify(described)).not.toContain("dune-secret");
  });

  it("turns a thrown non-error into a message", () => {
    expect(describeUpstreamError("boom")).toEqual({
      name: "Error",
      message: "boom",
    });
  });
});
