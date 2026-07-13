import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { recoverMessageAddress } from "viem";
import { createSiweMessage } from "viem/siwe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "@/app";
import {
  createAuthResolver,
  PREVIEW_LOGIN_ADDRESS,
  PREVIEW_LOGIN_SIGNATURE,
  type VerifySiweMessage,
} from "@/auth";
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

// Mirrors auth-instance.ts: the preview verifier accepts exactly the shared
// test pair and delegates everything else to the real (EOA) verifier.
const realVerify: VerifySiweMessage = async ({
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
const previewVerify: VerifySiweMessage = async (params) => {
  if (
    params.address.toLowerCase() === PREVIEW_LOGIN_ADDRESS &&
    params.signature === PREVIEW_LOGIN_SIGNATURE
  ) {
    return true;
  }
  return realVerify(params);
};

const previewLogin = async (
  app: ReturnType<typeof createApp>,
  host: string,
) => {
  const headers = {
    host,
    origin: `https://${host}`,
    "content-type": "application/json",
  };
  const nonceRes = await app.request("/api/auth/siwe/nonce", {
    method: "POST",
    headers,
    body: JSON.stringify({ walletAddress: PREVIEW_LOGIN_ADDRESS, chainId: 1 }),
  });
  if (nonceRes.status !== 200) return nonceRes;

  const { nonce } = (await nonceRes.json()) as { nonce: string };
  const message = createSiweMessage({
    domain: host,
    address: PREVIEW_LOGIN_ADDRESS,
    chainId: 1,
    nonce,
    uri: `https://${host}`,
    version: "1",
  });
  return app.request("/api/auth/siwe/verify", {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      signature: PREVIEW_LOGIN_SIGNATURE,
      walletAddress: PREVIEW_LOGIN_ADDRESS,
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
    verifyMessage: previewVerify,
    previewDynamicHosts,
  });

  const app = createApp({
    db,
    authResolver,
    draftsService: new DraftsService(new DraftsRepository(db)),
  });
  return { client, app };
};

describe("preview environments", () => {
  describe("preview mode on", () => {
    let client: PGlite;
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      ({ client, app } = await buildApp(true));
    });
    afterAll(async () => {
      await client.close();
    });

    it("advertises previewLogin in /auth/methods", async () => {
      const res = await app.request("/auth/methods", {
        headers: { host: STATIC_HOST },
      });
      await expect(res.json()).resolves.toMatchObject({ previewLogin: true });
    });

    it("signs in with the shared test credential on a dynamic vercel.app host", async () => {
      const res = await previewLogin(app, PREVIEW_HOST);
      expect(res.status).toBe(200);
      expect(res.headers.getSetCookie().join(";")).toContain(
        "better-auth.session_token",
      );
    });

    it("still refuses hosts outside *.vercel.app", async () => {
      const res = await previewLogin(app, "evil.example.com");
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "untrusted_host" });
    });

    it("refuses the test signature for any OTHER address", async () => {
      const host = PREVIEW_HOST;
      const headers = {
        host,
        origin: `https://${host}`,
        "content-type": "application/json",
      };
      const other = "0x2222222222222222222222222222222222222222";
      const nonceRes = await app.request("/api/auth/siwe/nonce", {
        method: "POST",
        headers,
        body: JSON.stringify({ walletAddress: other, chainId: 1 }),
      });
      const { nonce } = (await nonceRes.json()) as { nonce: string };
      const message = createSiweMessage({
        domain: host,
        address: other,
        chainId: 1,
        nonce,
        uri: `https://${host}`,
        version: "1",
      });
      const res = await app.request("/api/auth/siwe/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          signature: PREVIEW_LOGIN_SIGNATURE,
          walletAddress: other,
          chainId: 1,
        }),
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
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

    it("does not advertise previewLogin", async () => {
      const res = await app.request("/auth/methods", {
        headers: { host: STATIC_HOST },
      });
      await expect(res.json()).resolves.toMatchObject({ previewLogin: false });
    });

    it("refuses dynamic vercel.app hosts", async () => {
      const res = await previewLogin(app, PREVIEW_HOST);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "untrusted_host" });
    });
  });
});
