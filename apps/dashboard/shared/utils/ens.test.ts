import type { Address } from "viem";
import { encodeAbiParameters, zeroAddress } from "viem";
import { mainnet } from "viem/chains";

import { fetchAddressFromEnsName } from "@/shared/utils/ens";

const ERPC_URL = "https://rpc.example.com/dashboard/";
const ERPC_SECRET = "server-only-secret";
const APP_ORIGIN = "https://app.example.com";
const NICK = "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5";
const RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

// Universal Resolver `resolveWithGateways` result: (bytes addrResult, address resolver).
const universalResolverResult = (address: Address) =>
  encodeAbiParameters(
    [{ type: "bytes" }, { type: "address" }],
    [encodeAbiParameters([{ type: "address" }], [address]), RESOLVER],
  );

const mockRpcResolvingTo = (address: Address) =>
  jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const { id } = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: universalResolverResult(address),
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });

const firstRequest = () => {
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
  return {
    url: String(url),
    secret: new Headers(init?.headers).get("x-erpc-secret-token"),
  };
};

const runInBrowser = () =>
  Object.defineProperty(globalThis, "window", {
    value: { location: { origin: APP_ORIGIN } },
    configurable: true,
  });

describe("fetchAddressFromEnsName", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ERPC_URL;
    delete process.env.ERPC_SECRET;
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("resolves through the eRPC upstream with its secret on the server", async () => {
    process.env.ERPC_URL = ERPC_URL;
    process.env.ERPC_SECRET = ERPC_SECRET;
    global.fetch = mockRpcResolvingTo(NICK);

    const address = await fetchAddressFromEnsName({ ensName: "nick.eth" });

    expect({ address, request: firstRequest() }).toEqual({
      address: NICK,
      request: {
        url: "https://rpc.example.com/dashboard/evm/1",
        secret: ERPC_SECRET,
      },
    });
  });

  it("resolves through the dashboard's RPC proxy in the browser", async () => {
    process.env.ERPC_URL = ERPC_URL;
    process.env.ERPC_SECRET = ERPC_SECRET;
    runInBrowser();
    global.fetch = mockRpcResolvingTo(NICK);

    const address = await fetchAddressFromEnsName({ ensName: "nick.eth" });

    expect({ address, request: firstRequest() }).toEqual({
      address: NICK,
      request: { url: `${APP_ORIGIN}/api/rpc/1`, secret: null },
    });
  });

  it("falls back to viem's public mainnet endpoint without eRPC on the server", async () => {
    global.fetch = mockRpcResolvingTo(NICK);

    const address = await fetchAddressFromEnsName({ ensName: "nick.eth" });

    expect({ address, request: firstRequest() }).toEqual({
      address: NICK,
      request: {
        url: new URL(mainnet.rpcUrls.default.http[0]).href,
        secret: null,
      },
    });
  });

  it("returns null when the name has no address", async () => {
    global.fetch = mockRpcResolvingTo(zeroAddress);

    await expect(
      fetchAddressFromEnsName({ ensName: "unset.eth" }),
    ).resolves.toBeNull();
  });

  it("returns null without a lookup when the name can't be normalized", async () => {
    jest.spyOn(console, "warn").mockImplementation();
    global.fetch = jest.fn();

    const address = await fetchAddressFromEnsName({ ensName: "a b.eth" });

    expect({
      address,
      fetchCalls: (global.fetch as jest.Mock).mock.calls,
    }).toEqual({ address: null, fetchCalls: [] });
  });

  it("returns null when the RPC request fails", async () => {
    jest.spyOn(console, "warn").mockImplementation();
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(
      fetchAddressFromEnsName({ ensName: "nick.eth" }),
    ).resolves.toBeNull();
  });

  it("gives up after 5 seconds when the RPC doesn't answer", async () => {
    jest.useFakeTimers();
    const warn = jest.spyOn(console, "warn").mockImplementation();
    global.fetch = jest.fn(() => new Promise<Response>(() => {}));

    const lookup = fetchAddressFromEnsName({ ensName: "nick.eth" });
    await jest.advanceTimersByTimeAsync(5_000);

    expect({
      address: await lookup,
      warning: String(warn.mock.calls[0]?.[1]),
    }).toEqual({ address: null, warning: "Error: ENS lookup timed out" });
  });
});
