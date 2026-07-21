import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthfulClient, AuthfulResponseError } from "./authful-client";

const client = new AuthfulClient(
  "http://authful.internal",
  "validation-key",
  "usage-key",
);

describe("AuthfulClient usage delivery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the stable idempotency key with its usage batch", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const batch = {
      idempotencyKey: "11111111-1111-1111-1111-111111111111",
      items: [
        {
          tokenId: "22222222-2222-2222-2222-222222222222",
          day: "2026-07-20",
          count: 3,
        },
      ],
    };

    await client.recordUsage(batch);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://authful.internal/tokens/usage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer usage-key",
        },
        body: JSON.stringify(batch),
        signal: expect.any(AbortSignal),
      },
    );
  });

  it.each([
    [408, true],
    [429, true],
    [500, true],
    [400, false],
    [401, false],
    [403, false],
  ])("classifies HTTP %i retryability as %s", (status, expected) => {
    expect(client.isRetryableUsageError(new AuthfulResponseError(status))).toBe(
      expected,
    );
  });

  it("retries network failures whose commit result is unknown", () => {
    expect(client.isRetryableUsageError(new TypeError("fetch failed"))).toBe(
      true,
    );
  });
});
