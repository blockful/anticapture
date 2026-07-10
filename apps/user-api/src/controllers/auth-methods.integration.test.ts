import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createApp } from "@/app";
import { createAuthResolver } from "@/auth";
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

const HOST = "localhost:3000";
const ORIGIN = `http://${HOST}`;

const buildApp = (opts: {
  magicLink?: Parameters<typeof createAuthResolver>[0]["magicLink"];
  google?: Parameters<typeof createAuthResolver>[0]["google"];
}) => {
  const client = new PGlite();
  const db = drizzle(client, { schema: fullSchema });

  const authResolver = createAuthResolver({
    db,
    secret: "integration-test-secret-0123456789abcdef",
    domains: [HOST],
    verifyMessage: async () => false,
    magicLink: opts.magicLink,
    google: opts.google,
  });

  const app = createApp({
    db,
    authResolver,
    draftsService: new DraftsService(new DraftsRepository(db)),
  });

  return { client, db, app };
};

const applySchema = async (db: ReturnType<typeof drizzle>) => {
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
};

const headers = {
  host: HOST,
  origin: ORIGIN,
  "content-type": "application/json",
};

describe("optional auth methods", () => {
  describe("magic link enabled", () => {
    const sendMagicLink = vi.fn(
      async (_params: { email: string; url: string }) => undefined,
    );
    const { client, db, app } = buildApp({ magicLink: sendMagicLink });

    beforeAll(() => applySchema(db));
    afterAll(async () => {
      await client.close();
    });

    it("sends a magic link with a sign-in url when requested", async () => {
      const res = await app.request("/api/auth/sign-in/magic-link", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: "alice@example.com" }),
      });

      expect(res.status).toBe(200);
      expect(sendMagicLink).toHaveBeenCalledTimes(1);
      const arg = sendMagicLink.mock.calls[0]![0];
      expect(arg.email).toBe("alice@example.com");
      expect(arg.url).toContain("/api/auth/magic-link/verify");
    });

    it("advertises magic link in /auth/methods", async () => {
      const res = await app.request("/auth/methods", { headers });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        siwe: true,
        magicLink: true,
        google: false,
      });
    });
  });

  describe("magic link disabled (no sender configured)", () => {
    const { client, db, app } = buildApp({});

    beforeAll(() => applySchema(db));
    afterAll(async () => {
      await client.close();
    });

    it("does not expose the magic-link endpoint", async () => {
      const res = await app.request("/api/auth/sign-in/magic-link", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: "alice@example.com" }),
      });

      // 404 (route absent) — the method is off until a sender is wired.
      expect(res.status).toBe(404);
    });

    it("advertises only SIWE in /auth/methods", async () => {
      const res = await app.request("/auth/methods", { headers });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        siwe: true,
        magicLink: false,
        google: false,
      });
    });
  });

  describe("google configured", () => {
    const { client, db, app } = buildApp({
      google: { clientId: "gid", clientSecret: "gsecret" },
    });

    beforeAll(() => applySchema(db));
    afterAll(async () => {
      await client.close();
    });

    it("advertises google in /auth/methods", async () => {
      const res = await app.request("/auth/methods", { headers });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        siwe: true,
        magicLink: false,
        google: true,
      });
    });
  });
});
