import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthfulClient } from "./authful-client";

const VALID = {
  valid: true,
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
  rateLimitPerMin: 600,
};

function mockFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(VALID), { status: 200 })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return String(fetchMock.mock.calls[0]![0]);
}

describe("AuthfulClient base URL normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    "http://authful:4002",
    "http://authful:4002/",
    "http://authful:4002///",
  ])("hits /validate exactly once for base %s", async (baseUrl) => {
    const fetchMock = mockFetch();
    await new AuthfulClient(baseUrl, "internal-key").validate("a".repeat(64));
    expect(calledUrl(fetchMock)).toBe("http://authful:4002/validate");
  });

  it("trims trailing slashes for /usage/batch too", async () => {
    const fetchMock = mockFetch();
    await new AuthfulClient(
      "http://authful:4002/",
      "internal-key",
    ).recordUsageBatch([]);
    expect(calledUrl(fetchMock)).toBe("http://authful:4002/usage/batch");
  });
});
