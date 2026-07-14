import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { recoverMessageAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "@/app";
import { createAuthResolver, type VerifySiweMessage } from "@/auth";
import * as fullSchema from "@/database/schema";
import {
  account,
  drafts,
  session,
  user,
  verification,
  walletAddress,
} from "@/database/schema";
import { DraftsRepository } from "@/repositories/drafts";
import { DraftsService } from "@/services/drafts";

const STATIC_HOST = "app.anticapture.com";
const PREVIEW_HOST = "anticapture-abc123-ful.vercel.app";

// Throwaway test-only EOA — signs real SIWE messages offline.
const wallet = privateKeyToAccount(`0x${"11".repeat(32)}`);

// Offline EOA verifier (mirrors what publicClient.verifyMessage does for EOAs).
const verifyMessage: VerifySiweMessage = async ({
  message,
  signature,
  address,
}) => {
  const recovered = await recoverMessageAddress({
    message,
    signature: signature as `0x${string}`,
  });
  return recovered.toLowerCase() === address.toLowerCase();
};

const siweLogin = async (app: ReturnType<typeof createApp>, host: string) => {
  const headers = {
    host,
    origin: `https://${host}`,
    "content-type": "application/json",
  };
  const nonceRes = await app.request("/api/auth/siwe/nonce", {
    method: "POST",
    headers,
    body: JSON.stringify({ walletAddress: wallet.address, chainId: 1 }),
  });
  if (nonceRes.status !== 200) return nonceRes;

  const { nonce } = (await nonceRes.json()) as { nonce: string };
  const message = createSiweMessage({
    domain: host,
    address: wallet.address,
    chainId: 1,
    nonce,
    uri: `https://${host}`,
    version: "1",
  });
  const signature = await wallet.signMessage({ message });
  return app.request("/api/auth/siwe/verify", {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      signature,
      walletAddress: wallet.address,
      chainId: 1,
    }),
  });
};

const buildApp = async (previewDynamicHosts: boolean) => {
  const client = new PGlite();
  const db = drizzle(client, { schema: fullSchema });
  const tables = {
    user,
    session,
    account,
    verification,
    walletAddress,
    drafts,
  };
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(tables as any, db as any);
  await apply();

  const authResolver = createAuthResolver({
    db,
    secret: "integration-test-secret-0123456789abcdef",
    domains: [STATIC_HOST],
    verifyMessage,
    previewDynamicHosts,
  });

  const app = createApp({
    db,
    authResolver,
    draftsService: new DraftsService(new DraftsRepository(db)),
  });
  return { client, app };
};

describe("preview dynamic hosts", () => {
  describe("preview mode on", () => {
    let client: PGlite;
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      ({ client, app } = await buildApp(true));
    });
    afterAll(async () => {
      await client.close();
    });

    it("signs in with real SIWE on a dynamic vercel.app host", async () => {
      const res = await siweLogin(app, PREVIEW_HOST);
      expect(res.status).toBe(200);
      expect(res.headers.getSetCookie().join(";")).toContain(
        "better-auth.session_token",
      );
    });

    it("still refuses hosts outside *.vercel.app", async () => {
      const res = await siweLogin(app, "evil.example.com");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "untrusted_host" });
    });
  });

  describe("preview mode off (dev/production posture)", () => {
    let client: PGlite;
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      ({ client, app } = await buildApp(false));
    });
    afterAll(async () => {
      await client.close();
    });

    it("refuses dynamic vercel.app hosts", async () => {
      const res = await siweLogin(app, PREVIEW_HOST);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "untrusted_host" });
    });
  });
});
