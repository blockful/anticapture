import { NextRequest } from "next/server";

import { POST } from "./route";

const originalFetch = global.fetch;
const originalEnvironment = { ...process.env };

const createRequest = (ip: string, overrides = {}) =>
  new NextRequest("http://localhost:3000/api/report", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify({
      daoId: "ens",
      section: "token-distribution",
      panel: "Token distribution",
      description: "The displayed supply is stale.",
      email: "reporter@example.com",
      url: "http://localhost:3000/ens/token-distribution",
      ...overrides,
    }),
  });

describe("POST /api/report", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
      CLICKUP_API_TOKEN: "clickup-token",
      CLICKUP_REPORT_LIST_ID: "901327958573",
    };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnvironment;
    global.fetch = originalFetch;
  });

  it("creates a ClickUp task containing report context", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const response = await POST(createRequest("203.0.113.1"));

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.clickup.com/api/v2/list/901327958573/task",
      expect.objectContaining({
        headers: {
          Authorization: "clickup-token",
          "content-type": "application/json",
        },
        body: expect.stringContaining("[Report] ENS — Token distribution"),
      }),
    );
    expect(
      String(
        (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls[0][1]
          ?.body,
      ),
    ).toContain("reporter@example.com");
  });

  it("rejects the fourth report from one trusted IP", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const ip = "203.0.113.2";

    await POST(createRequest(ip));
    await POST(createRequest(ip));
    await POST(createRequest(ip));
    const response = await POST(createRequest(ip));

    expect(response.status).toBe(429);
  });

  it("returns a graceful error when ClickUp fails", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response("error", { status: 500 }),
    );

    const response = await POST(createRequest("203.0.113.3"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "We couldn't submit your report. Please try again shortly.",
    });
  });
});
