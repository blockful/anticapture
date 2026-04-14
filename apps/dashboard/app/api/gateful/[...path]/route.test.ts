import { NextRequest } from "next/server";

import { GET } from "./route";

const MOCK_GATEFUL_URL = "https://gateful.mock.local";

describe("Gateful proxy route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GATEFUL_URL = MOCK_GATEFUL_URL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GATEFUL_URL;
  });

  it("forwards path segments and query params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gateful/comp/feed/events?limit=5&relevance=HIGH",
    );

    await GET(request, {
      params: Promise.resolve({
        path: ["comp", "feed", "events"],
      }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      new URL(`${MOCK_GATEFUL_URL}/comp/feed/events?limit=5&relevance=HIGH`),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("injects the server-side BLOCKFUL_API_TOKEN as authorization header", async () => {
    process.env.BLOCKFUL_API_TOKEN = "server-secret";

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gateful/comp/feed/events",
    );

    await GET(request, {
      params: Promise.resolve({
        path: ["comp", "feed", "events"],
      }),
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ];
    const headers = init.headers as Headers;

    expect(headers.get("authorization")).toBe("Bearer server-secret");

    delete process.env.BLOCKFUL_API_TOKEN;
  });

  it("sends no authorization header when BLOCKFUL_API_TOKEN is not set", async () => {
    delete process.env.BLOCKFUL_API_TOKEN;

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gateful/comp/feed/events",
    );

    await GET(request, {
      params: Promise.resolve({
        path: ["comp", "feed", "events"],
      }),
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ];
    const headers = init.headers as Headers;

    expect(headers.get("authorization")).toBeNull();
  });

  it("returns the upstream status and body unchanged", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response("upstream failure", {
        status: 418,
        headers: {
          "content-type": "text/plain",
        },
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gateful/comp/feed/events",
    );

    const response = await GET(request, {
      params: Promise.resolve({
        path: ["comp", "feed", "events"],
      }),
    });

    expect(response.status).toBe(418);
    expect(await response.text()).toBe("upstream failure");
  });
});
