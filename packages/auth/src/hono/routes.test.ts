import { OpenAPIHono } from "@hono/zod-openapi";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { beforeEach, describe, expect, it } from "vitest";

import { memoryNonceStore } from "../stores/memory.js";
import type { NonceStore } from "../nonce.js";
import { siweAuth } from "./middleware.js";
import { mountAuthRoutes } from "./routes.js";

const DOMAIN = "example.com";
const CHAIN_ID = 1;
const SECRET = "integration-test-secret-0123456789abcdef";

const account = privateKeyToAccount(
  "0x0facf9ffca9fdaea885fdc870edcd1064b89b7ff935b28896e242874ca380760",
);

const buildApp = (store: NonceStore) => {
  const app = new OpenAPIHono();

  mountAuthRoutes(app, {
    store,
    secret: SECRET,
    domain: DOMAIN,
    chainId: CHAIN_ID,
  });

  app.get("/protected", siweAuth({ secret: SECRET }), (c) => {
    const user = c.get("siweUser") as { address: string };
    return c.json({ address: user.address });
  });

  return app;
};

describe("mountAuthRoutes + siweAuth integration", () => {
  let store: NonceStore;
  let app: OpenAPIHono;

  beforeEach(() => {
    store = memoryNonceStore();
    app = buildApp(store);
  });

  const getNonce = async (): Promise<string> => {
    const res = await app.request("/auth/nonce");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { nonce: string };
    return body.nonce;
  };

  const verify = async (message: string, signature: string) =>
    app.request("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });

  it("completes the full nonce -> sign -> verify -> authorized request flow", async () => {
    const nonce = await getNonce();
    const message = createSiweMessage({
      address: account.address,
      chainId: CHAIN_ID,
      domain: DOMAIN,
      nonce,
      uri: `https://${DOMAIN}`,
      version: "1",
    });
    const signature = await account.signMessage({ message });

    const verifyRes = await verify(message, signature);
    expect(verifyRes.status).toBe(200);
    const { token, address } = (await verifyRes.json()) as {
      token: string;
      address: string;
    };
    expect(token).toBeTruthy();

    const protectedRes = await app.request("/protected", {
      headers: { "x-user-token": token },
    });
    expect(protectedRes.status).toBe(200);
    const protectedBody = (await protectedRes.json()) as { address: string };
    expect(protectedBody.address).toBe(address);
  });

  it("rejects a reused nonce", async () => {
    const nonce = await getNonce();
    const message = createSiweMessage({
      address: account.address,
      chainId: CHAIN_ID,
      domain: DOMAIN,
      nonce,
      uri: `https://${DOMAIN}`,
      version: "1",
    });
    const signature = await account.signMessage({ message });

    const first = await verify(message, signature);
    expect(first.status).toBe(200);

    const second = await verify(message, signature);
    expect(second.status).toBe(401);
  });

  it("surfaces an unexpected store error as 5xx, not a 401", async () => {
    const failingStore: NonceStore = {
      issue: async () => {},
      consume: async () => {
        throw new Error("store outage");
      },
    };
    const failingApp = buildApp(failingStore);

    const message = createSiweMessage({
      address: account.address,
      chainId: CHAIN_ID,
      domain: DOMAIN,
      nonce: "abcdefgh12345678",
      uri: `https://${DOMAIN}`,
      version: "1",
    });
    const signature = await account.signMessage({ message });

    const res = await failingApp.request("/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });

    // The infra failure must NOT masquerade as a verification (401) failure.
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it("returns distinguishable 401 reasons from siweAuth", async () => {
    const missing = await app.request("/protected");
    expect(missing.status).toBe(401);
    expect(await missing.json()).toEqual({ error: "missing_token" });

    const invalid = await app.request("/protected", {
      headers: { "x-user-token": "not-a-real-token" },
    });
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toEqual({ error: "invalid_token" });
  });
});
