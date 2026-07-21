import { NextRequest } from "next/server";

import { POST } from "./route";

const ERPC_URL = "https://rpc.example.com/dashboard";
const ERPC_SECRET = "server-only-secret";
const originalFetch = global.fetch;
const originalEnvironment = { ...process.env };

const createRequest = () =>
  new NextRequest("http://localhost:3000/api/rpc/1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId" }),
  });

const createContext = (chainId: string) => ({
  params: Promise.resolve({ chainId }),
});

describe("Wallet RPC proxy route", () => {
  beforeEach(() => {
    delete process.env.ERPC_URL;
    delete process.env.ERPC_SECRET;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnvironment;
    global.fetch = originalFetch;
  });

  it("injects the eRPC secret server-side", async () => {
    process.env.ERPC_URL = ERPC_URL;
    process.env.ERPC_SECRET = ERPC_SECRET;
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(createRequest(), createContext("1"));
    const [url, init] = (global.fetch as jest.MockedFunction<typeof fetch>).mock
      .calls[0];

    expect({
      url: url.toString(),
      method: init?.method,
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body,
      cache: init?.cache,
      responseStatus: response.status,
      responseBody: await response.json(),
    }).toEqual({
      url: `${ERPC_URL}/evm/1`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-erpc-secret-token": ERPC_SECRET,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
      }),
      cache: "no-store",
      responseStatus: 200,
      responseBody: { jsonrpc: "2.0", id: 1, result: "0x1" },
    });
  });

  it("rejects unsupported chains without contacting an upstream", async () => {
    const response = await POST(createRequest(), createContext("11155111"));

    expect({
      fetchCalls: (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls,
      responseStatus: response.status,
      responseBody: await response.json(),
    }).toEqual({
      fetchCalls: [],
      responseStatus: 400,
      responseBody: { error: "Unsupported chain" },
    });
  });

  it.each([
    {
      name: "both eRPC values are missing",
      erpcUrl: undefined,
      erpcSecret: undefined,
    },
    {
      name: "the eRPC URL is missing",
      erpcUrl: undefined,
      erpcSecret: ERPC_SECRET,
    },
    {
      name: "the eRPC secret is missing",
      erpcUrl: ERPC_URL,
      erpcSecret: undefined,
    },
  ])("fails closed when $name", async ({ erpcUrl, erpcSecret }) => {
    if (erpcUrl) process.env.ERPC_URL = erpcUrl;
    if (erpcSecret) process.env.ERPC_SECRET = erpcSecret;

    const response = await POST(createRequest(), createContext("1"));

    expect({
      fetchCalls: (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls,
      responseStatus: response.status,
      responseBody: await response.json(),
    }).toEqual({
      fetchCalls: [],
      responseStatus: 500,
      responseBody: { error: "Wallet RPC service is not configured" },
    });
  });

  it("does not expose upstream details when the request fails", async () => {
    process.env.ERPC_URL = ERPC_URL;
    process.env.ERPC_SECRET = ERPC_SECRET;
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new Error(`Request failed for ${ERPC_URL} using ${ERPC_SECRET}`),
    );

    const response = await POST(createRequest(), createContext("1"));

    expect({
      consoleErrors: consoleError.mock.calls,
      responseStatus: response.status,
      responseBody: await response.json(),
    }).toEqual({
      consoleErrors: [["Wallet RPC proxy request failed"]],
      responseStatus: 502,
      responseBody: { error: "Wallet RPC service is unavailable" },
    });
  });
});
