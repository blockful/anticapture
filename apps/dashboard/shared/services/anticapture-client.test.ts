import { client } from "@anticapture/client";

describe("Anticapture client", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
  });

  it("preserves the configured absolute baseURL origin for relative requests", async () => {
    await client({
      baseURL: "https://gateful.mock.local/api",
      url: "/comp/feed/events",
      params: {
        limit: 5,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://gateful.mock.local/api/comp/feed/events?limit=5",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
