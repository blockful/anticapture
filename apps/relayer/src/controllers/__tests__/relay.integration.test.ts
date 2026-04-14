import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { type Address, type Hex, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { relayVote } from "../relay-vote";
import { relayDelegate } from "../relay-delegate";
import { health } from "../health";
import { RelayService } from "@/services/relay";
import { ChainStateService } from "@/services/chain-state";
import { EligibilityService } from "@/services/eligibility";
import { SignatureVerifier } from "@/services/signature-verifier";
import { RateLimiter } from "@/lib/rate-limiter";
import { createLocalSigner } from "@/signer/local-signer";
import { RelayError } from "@/errors";
import { fromZodError } from "zod-validation-error";
import { createPublicClient, http as viemHttp } from "viem";
import { mainnet } from "viem/chains";

const TEST_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex;
const GOVERNOR = "0x1111111111111111111111111111111111111111" as Address;
const TOKEN = "0x2222222222222222222222222222222222222222" as Address;
const RPC_URL = "http://localhost:8545";

function encodeStringResult(str: string): string {
  const hex = Buffer.from(str).toString("hex");
  const offset = "0".repeat(63) + "20"; // offset to data
  const length = str.length.toString(16).padStart(64, "0");
  const data = hex.padEnd(64, "0");
  return "0x" + offset + length + data;
}

// MSW intercepts all RPC JSON-RPC calls
const rpcHandlers = [
  http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as {
      method: string;
      params?: unknown[];
    };

    // eth_getBalance — relayer has plenty of ETH
    if (body.method === "eth_getBalance") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: 1,
        result: "0x" + parseEther("10.0").toString(16),
      });
    }

    // eth_call — route based on the call data
    if (body.method === "eth_call") {
      const params = body.params as [{ to: string; data: string }];
      const to = params[0]?.to?.toLowerCase() ?? "";
      const selector = params[0]?.data?.slice(0, 10) ?? "";

      const responses: Record<string, string> = {
        // state(uint256) → Active = 1
        "0x3e4f49e6": "0x" + "0".repeat(63) + "1",
        // hasVoted(uint256,address) → false
        "0x43859632": "0x" + "0".repeat(64),
        // getVotes(address) → 1000 * 1e18
        "0x9ab24eb0":
          "0x" + (1000n * 10n ** 18n).toString(16).padStart(64, "0"),
        // nonces(address) → 0
        "0x7ecebe00": "0x" + "0".repeat(64),
        // name() → "TestGovernor" / "TestToken"
        "0x06fdde03":
          to === GOVERNOR.toLowerCase()
            ? encodeStringResult("TestGovernor")
            : encodeStringResult("TestToken"),
      };

      return HttpResponse.json({
        jsonrpc: "2.0",
        id: 1,
        result: responses[selector] ?? "0x" + "0".repeat(64),
      });
    }

    // eth_sendRawTransaction → fake tx hash
    if (body.method === "eth_sendRawTransaction") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: 1,
        result:
          "0xabcd000000000000000000000000000000000000000000000000000000000001",
      });
    }

    // Fallback for other RPC methods (chainId, gasPrice, etc.)
    return HttpResponse.json({ jsonrpc: "2.0", id: 1, result: "0x1" });
  }),
];

const mswServer = setupServer(...rpcHandlers);

function createApp(): Hono {
  const app = new Hono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return c.json(
          { error: validationError.message, code: "VALIDATION_ERROR" },
          400,
        );
      }
    },
  });

  app.onError((err, c) => {
    if (err instanceof RelayError) {
      return c.json({ error: err.message, code: err.code }, err.status as 400);
    }
    return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
  });

  // Real services, real wiring — only RPC is intercepted by MSW
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: viemHttp(RPC_URL),
  });

  const signer = createLocalSigner(TEST_PK, mainnet, RPC_URL);
  const chainState = new ChainStateService(publicClient, GOVERNOR, TOKEN);

  const signatureVerifier = new SignatureVerifier(
    {
      name: "TestGovernor",
      version: "1",
      chainId: 1,
      verifyingContract: GOVERNOR,
    },
    {
      name: "TestToken",
      version: "1",
      chainId: 1,
      verifyingContract: TOKEN,
    },
  );

  const eligibility = new EligibilityService(chainState, {
    minVotingPower: 0n, // No threshold for integration tests
    delegationCooldownDays: 0,
  });

  const rateLimiter = new RateLimiter({
    maxPerAddressPerDay: 100,
    maxPerAddressPerHour: 50,
  });

  const relayService = new RelayService(
    signer,
    signatureVerifier,
    eligibility,
    chainState,
    rateLimiter,
    publicClient,
    parseEther("0.1"),
    GOVERNOR,
    TOKEN,
  );

  relayVote(app, relayService);
  relayDelegate(app, relayService);
  health(app, signer, publicClient, parseEther("0.1"));

  return app;
}

describe("Relay Controllers (Integration)", () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: "bypass" }));
  afterEach(() => mswServer.resetHandlers());
  afterAll(() => mswServer.close());

  describe("POST /relay/vote", () => {
    it("returns 200 with tx hash for a valid signed vote", async () => {
      const app = createApp();
      const account = privateKeyToAccount(TEST_PK);

      const proposalId = 1n;
      const support = 1;

      const signature = await account.signTypedData({
        domain: {
          name: "TestGovernor",
          version: "1",
          chainId: 1,
          verifyingContract: GOVERNOR,
        },
        types: {
          Ballot: [
            { name: "proposalId", type: "uint256" },
            { name: "support", type: "uint8" },
          ],
        },
        primaryType: "Ballot",
        message: { proposalId, support },
      });

      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const v = parseInt(signature.slice(130, 132), 16);

      const res = await app.request("/relay/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposalId.toString(),
          support,
          v,
          r,
          s,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        transactionHash: expect.stringMatching(/^0x[0-9a-f]{64}$/),
        voter: account.address,
      });
    });

    it("returns 400 for invalid request body", async () => {
      const app = createApp();

      const res = await app.request("/relay/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({
        error: expect.stringContaining("Validation"),
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("GET /health", () => {
    it("returns 200 with relayer status", async () => {
      const app = createApp();

      const res = await app.request("/health");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        status: "healthy",
        relayerAddress: expect.stringMatching(/^0x[0-9a-fA-F]{40}$/),
        balance: expect.any(String),
        belowThreshold: false,
      });
    });
  });
});
