import { PGlite } from "@electric-sql/pglite";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { pushSchema } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "@/app";
import type { TokenfulDrizzle } from "@/database";
import * as schema from "@/database/schema";
import { tokens, usageHourly } from "@/database/schema";
import { TokensRepository } from "@/repositories/tokens";
import { TokensService, hashToken } from "@/services/tokens";

const ADMIN_KEY = "test-admin-key-0123456789";
const INTERNAL_KEY = "test-internal-key-0123456789";

const adminHeaders = {
  Authorization: `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
};
const internalHeaders = {
  Authorization: `Bearer ${INTERNAL_KEY}`,
  "Content-Type": "application/json",
};

describe("tokenful app", () => {
  let client: PGlite;
  let db: TokenfulDrizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    app = createApp({
      service: new TokensService(new TokensRepository(db)),
      adminApiKey: ADMIN_KEY,
      internalApiKey: INTERNAL_KEY,
    });
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(usageHourly);
    await db.delete(tokens);
  });

  type MintResponse = {
    id: string;
    tenant: string;
    name: string;
    rateLimitPerMin: number;
    token: string;
  };

  async function mint(body: Record<string, unknown>): Promise<MintResponse> {
    const res = await app.request("/tokens", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ tenant: "uniswap", name: "uniswap mcp", ...body }),
    });
    expect(res.status).toBe(201);
    return (await res.json()) as MintResponse;
  }

  describe("auth boundaries", () => {
    it("rejects admin endpoints without the admin key", async () => {
      for (const [method, path] of [
        ["POST", "/tokens"],
        ["GET", "/tokens"],
        ["DELETE", `/tokens/${crypto.randomUUID()}`],
      ] as const) {
        const res = await app.request(path, { method });
        expect(res.status).toBe(401);
      }
    });

    it("rejects internal endpoints without the internal key", async () => {
      for (const path of ["/validate", "/usage/batch"]) {
        const res = await app.request(path, {
          method: "POST",
          headers: adminHeaders, // admin key must NOT open internal surface
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(401);
      }
    });

    it("keeps /health public", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /tokens", () => {
    it("mints a token and returns the plaintext exactly once", async () => {
      const body = await mint({});
      expect(body.token).toMatch(/^act_/);
      expect(body.tenant).toBe("uniswap");
      expect(body.rateLimitPerMin).toBe(600);

      // Only the hash is stored
      const [row] = await db.select().from(tokens);
      expect(row!.tokenHash).toBe(hashToken(body.token));
      expect(JSON.stringify(row)).not.toContain(body.token);
    });

    it("seeds an existing plaintext credential (migration path)", async () => {
      const legacyKey = "legacy-uniswap-shared-key-123456";
      const body = await mint({ plaintext: legacyKey, rateLimitPerMin: 1200 });
      expect(body.token).toBe(legacyKey);
      expect(body.rateLimitPerMin).toBe(1200);

      const [row] = await db.select().from(tokens);
      expect(row!.tokenHash).toBe(hashToken(legacyKey));
    });

    it("returns 409 when seeding the same credential twice", async () => {
      await mint({ plaintext: "duplicated-credential-123456" });
      const res = await app.request("/tokens", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          tenant: "other",
          name: "dup",
          plaintext: "duplicated-credential-123456",
        }),
      });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /tokens", () => {
    it("lists metadata without hashes or plaintext", async () => {
      const minted = await mint({});
      const res = await app.request("/tokens", { headers: adminHeaders });
      expect(res.status).toBe(200);
      const { items } = (await res.json()) as {
        items: Array<Record<string, unknown>>;
      };
      expect(items).toHaveLength(1);
      expect(items[0]!.id).toBe(minted.id);
      expect(items[0]!.token).toBeUndefined();
      expect(items[0]!.tokenHash).toBeUndefined();
    });
  });

  describe("DELETE /tokens/{id}", () => {
    it("revokes a token (idempotent) and invalidates it", async () => {
      const minted = await mint({});

      for (let i = 0; i < 2; i++) {
        const res = await app.request(`/tokens/${minted.id}`, {
          method: "DELETE",
          headers: adminHeaders,
        });
        expect(res.status).toBe(204);
      }

      const validateRes = await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken(minted.token) }),
      });
      await expect(validateRes.json()).resolves.toEqual({ valid: false });
    });

    it("returns 404 for an unknown id", async () => {
      const res = await app.request(`/tokens/${crypto.randomUUID()}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /validate", () => {
    it("validates an active token and touches last_used_at", async () => {
      const minted = await mint({ rateLimitPerMin: 900 });

      const res = await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken(minted.token) }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        valid: true,
        tokenId: minted.id,
        tenant: "uniswap",
        rateLimitPerMin: 900,
      });

      const [row] = await db
        .select()
        .from(tokens)
        .where(eq(tokens.id, minted.id));
      expect(row!.lastUsedAt).not.toBeNull();
    });

    it("rejects an unknown hash", async () => {
      const res = await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken("never-minted") }),
      });
      await expect(res.json()).resolves.toEqual({ valid: false });
    });
  });

  describe("POST /usage/batch", () => {
    it("accumulates counts per (token, route, hour)", async () => {
      const minted = await mint({});
      const hour = "2026-06-10T14:00:00.000Z";
      const entry = {
        tokenId: minted.id,
        route: "/{dao}/proposals",
        hour,
        count: 5,
      };

      for (let i = 0; i < 2; i++) {
        const res = await app.request("/usage/batch", {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ entries: [entry] }),
        });
        expect(res.status).toBe(200);
      }

      const rows = await db.select().from(usageHourly);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.count).toBe(10n);
    });

    it("truncates timestamps to the hour", async () => {
      const minted = await mint({});
      const res = await app.request("/usage/batch", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          entries: [
            {
              tokenId: minted.id,
              route: "/daos",
              hour: "2026-06-10T14:37:21.000Z",
              count: 1,
            },
            {
              tokenId: minted.id,
              route: "/daos",
              hour: "2026-06-10T14:59:59.000Z",
              count: 2,
            },
          ],
        }),
      });
      expect(res.status).toBe(200);

      const rows = await db.select().from(usageHourly);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.hour.toISOString()).toBe("2026-06-10T14:00:00.000Z");
      expect(rows[0]!.count).toBe(3n);
    });
  });
});
