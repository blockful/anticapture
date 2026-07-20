import { PGlite } from "@electric-sql/pglite";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { pushSchema } from "drizzle-kit/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { createApp } from "@/app";
import type { AuthfulDrizzle } from "@/database";
import * as schema from "@/database/schema";
import { tokenUsageDaily, tokens } from "@/database/schema";
import { tokenValidationRequestTotal } from "@/metrics";
import { TokensRepository } from "@/repositories/tokens";
import { TokensService, hashToken } from "@/services/tokens";

const ADMIN_KEY = "test-admin-key-0123456789";
const INTERNAL_KEY = "test-internal-key-0123456789";
const PROVISIONING_KEY = "test-provisioning-key-0123456789";

const adminHeaders = {
  Authorization: `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
};
const internalHeaders = {
  Authorization: `Bearer ${INTERNAL_KEY}`,
  "Content-Type": "application/json",
};
const provisioningHeaders = {
  Authorization: `Bearer ${PROVISIONING_KEY}`,
  "Content-Type": "application/json",
};

describe("authful app", () => {
  let client: PGlite;
  let db: AuthfulDrizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    app = createApp({
      service: new TokensService(new TokensRepository(db)),
      db,
      adminApiKey: ADMIN_KEY,
      internalApiKey: INTERNAL_KEY,
      provisioningApiKey: PROVISIONING_KEY,
    });
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(tokenUsageDaily);
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
      const res = await app.request("/validate", {
        method: "POST",
        headers: adminHeaders, // admin key must NOT open internal surface
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });

    it("keeps /health public", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
    });

    it("rejects an unknown bearer token", async () => {
      const res = await app.request("/tokens", {
        method: "POST",
        headers: {
          Authorization: "Bearer not-a-real-key-000000000000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant: "user:1", name: "x" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 503 when the DB probe fails", async () => {
      const failingDb = {
        execute: () => Promise.reject(new Error("db down")),
      } as unknown as AuthfulDrizzle;
      const failingApp = createApp({
        service: new TokensService(new TokensRepository(db)),
        db: failingDb,
        adminApiKey: ADMIN_KEY,
        internalApiKey: INTERNAL_KEY,
      });
      const res = await failingApp.request("/health");
      expect(res.status).toBe(503);
    });

    it("exposes Prometheus metrics publicly", async () => {
      const res = await app.request("/metrics");
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
    });
  });

  describe("provisioning scope", () => {
    const provMint = (body: Record<string, unknown>) =>
      app.request("/tokens", {
        method: "POST",
        headers: provisioningHeaders,
        body: JSON.stringify(body),
      });

    it("mints a user:* token", async () => {
      const res = await provMint({ tenant: "user:abc", name: "my-agent" });
      expect(res.status).toBe(201);
      const body = (await res.json()) as MintResponse;
      expect(body.tenant).toBe("user:abc");
      expect(body.token).toMatch(/^act_/);
    });

    it("cannot mint a first-party (non-user) tenant", async () => {
      const res = await provMint({ tenant: "uniswap", name: "sneaky" });
      expect(res.status).toBe(403);
      const before = await app.request("/tokens", { headers: adminHeaders });
      const { items } = (await before.json()) as { items: unknown[] };
      expect(items).toHaveLength(0);
    });

    it("cannot list all tokens (no tenant filter)", async () => {
      const res = await app.request("/tokens", {
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(403);
    });

    it("cannot list a non-user tenant", async () => {
      const res = await app.request("/tokens?tenant=uniswap", {
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(403);
    });

    it("lists only its own user:* tenant", async () => {
      await provMint({ tenant: "user:abc", name: "one" });
      await provMint({ tenant: "user:abc", name: "two" });
      await mint({ tenant: "uniswap" }); // must not leak into the result

      const res = await app.request("/tokens?tenant=user:abc", {
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(200);
      const { items } = (await res.json()) as {
        items: { tenant: string; lastUsedAt: string | null }[];
      };
      expect(items).toHaveLength(2);
      expect(items.every((t) => t.tenant === "user:abc")).toBe(true);
    });

    it("revokes its own user:* token", async () => {
      const minted = (await (
        await provMint({ tenant: "user:abc", name: "temp" })
      ).json()) as MintResponse;
      const res = await app.request(`/tokens/${minted.id}`, {
        method: "DELETE",
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(204);
    });

    it("cannot revoke a first-party token — 404, not 403 (no oracle)", async () => {
      const firstParty = await mint({ tenant: "uniswap" });
      const res = await app.request(`/tokens/${firstParty.id}`, {
        method: "DELETE",
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(404);

      // The token is untouched — admin can still see it active.
      const list = await app.request("/tokens", { headers: adminHeaders });
      const { items } = (await list.json()) as {
        items: { id: string; revokedAt: string | null }[];
      };
      expect(items.find((t) => t.id === firstParty.id)?.revokedAt).toBeNull();
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

    it("accepts rateLimitPerMin 0 to mint an unbounded token", async () => {
      const body = await mint({ rateLimitPerMin: 0 });
      expect(body.rateLimitPerMin).toBe(0);

      const [row] = await db.select().from(tokens);
      expect(row!.rateLimitPerMin).toBe(0);
    });

    it("rejects a body sent without a JSON content-type (no silent {})", async () => {
      // Regression: without `required: true`, @hono/zod-openapi skips
      // validation for a non-JSON content-type and substitutes {}, so mint
      // would generate a token with a null tenant and hit a NOT NULL violation.
      const res = await app.request("/tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${ADMIN_KEY}` }, // form-encoded default
        body: "tenant=uniswap&name=uniswap+mcp",
      });
      expect(res.status).toBe(400);

      const rows = await db.select().from(tokens);
      expect(rows).toHaveLength(0);
    });

    it("rejects an empty JSON body (missing tenant/name)", async () => {
      const res = await app.request("/tokens", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("seed (CI/preview bootstrap)", () => {
    it("seeds a known token, is idempotent, and validates", async () => {
      const service = new TokensService(new TokensRepository(db));
      const plaintext = "ci-seed-token-0123456789";

      const first = await service.seed({
        plaintext,
        tenant: "ci",
        name: "ci seed token",
      });
      expect(first.created).toBe(true);
      expect(first.token.tenant).toBe("ci");

      // Re-running (e.g. on restart) is a no-op, not a duplicate or a throw.
      const second = await service.seed({
        plaintext,
        tenant: "ci",
        name: "ci seed token",
      });
      expect(second.created).toBe(false);
      expect(second.token.id).toBe(first.token.id);

      // Exactly one row, stored as a hash only.
      const rows = await db.select().from(tokens);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.tokenHash).toBe(hashToken(plaintext));

      // The seeded plaintext authenticates through the validate surface.
      const res = await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken(plaintext) }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        valid: true,
        tenant: "ci",
      });
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

  describe("token usage", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("upserts duplicate increments and ignores unknown token ids", async () => {
      const minted = await mint({ tenant: "user:abc" });
      const day = new Date().toISOString().slice(0, 10);

      const res = await app.request("/tokens/usage", {
        method: "POST",
        headers: provisioningHeaders,
        body: JSON.stringify({
          items: [
            { tokenId: minted.id, day, count: 2 },
            { tokenId: minted.id, day, count: 3 },
            { tokenId: crypto.randomUUID(), day, count: 99 },
            { tokenId: minted.id, day: "2099-01-01", count: 99 },
          ],
        }),
      });
      expect(res.status).toBe(204);

      const second = await app.request("/tokens/usage", {
        method: "POST",
        headers: provisioningHeaders,
        body: JSON.stringify({
          items: [{ tokenId: minted.id, day, count: 4 }],
        }),
      });
      expect(second.status).toBe(204);

      const rows = await db.select().from(tokenUsageDaily);
      expect(rows).toEqual([{ tokenId: minted.id, day, count: 9 }]);
    });

    it("scopes reads by tenant and returns only the last 30 days", async () => {
      const own = await mint({ tenant: "user:abc", name: "own" });
      const other = await mint({ tenant: "user:def", name: "other" });
      const today = new Date().toISOString().slice(0, 10);
      const oldDate = new Date();
      oldDate.setUTCDate(oldDate.getUTCDate() - 30);
      const oldDay = oldDate.toISOString().slice(0, 10);
      await db.insert(tokenUsageDaily).values([
        { tokenId: own.id, day: today, count: 7 },
        { tokenId: own.id, day: oldDay, count: 8 },
        { tokenId: other.id, day: today, count: 9 },
      ]);

      const res = await app.request("/tokens/usage?tenant=user%3Aabc", {
        headers: provisioningHeaders,
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        items: [{ tokenId: own.id, day: today, count: 7 }],
      });
    });

    it("prunes rows older than the retention boundary on write", async () => {
      const minted = await mint({ tenant: "user:abc" });
      const staleDate = new Date();
      staleDate.setUTCDate(staleDate.getUTCDate() - 31);
      const staleDay = staleDate.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      await db
        .insert(tokenUsageDaily)
        .values({ tokenId: minted.id, day: staleDay, count: 10 });

      const res = await app.request("/tokens/usage", {
        method: "POST",
        headers: provisioningHeaders,
        body: JSON.stringify({
          items: [{ tokenId: minted.id, day: today, count: 1 }],
        }),
      });
      expect(res.status).toBe(204);

      const rows = await db.select().from(tokenUsageDaily);
      expect(rows).toEqual([{ tokenId: minted.id, day: today, count: 1 }]);
    });

    it("prevents provisioning scope from recording or reading ops usage", async () => {
      const minted = await mint({ tenant: "uniswap" });
      const day = new Date().toISOString().slice(0, 10);

      const post = await app.request("/tokens/usage", {
        method: "POST",
        headers: provisioningHeaders,
        body: JSON.stringify({
          items: [{ tokenId: minted.id, day, count: 5 }],
        }),
      });
      expect(post.status).toBe(204);
      expect(await db.select().from(tokenUsageDaily)).toEqual([]);

      const get = await app.request("/tokens/usage?tenant=uniswap", {
        headers: provisioningHeaders,
      });
      expect(get.status).toBe(403);
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
      expect(validateRes.status).toBe(200);
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
        name: "uniswap mcp",
        rateLimitPerMin: 900,
      });

      const [row] = await db
        .select()
        .from(tokens)
        .where(eq(tokens.id, minted.id));
      expect(row!.lastUsedAt).not.toBeNull();
    });

    it("counts valid token validations by tenant and token name", async () => {
      const add = vi.spyOn(tokenValidationRequestTotal, "add");
      const minted = await mint({ name: "prod mcp" });

      await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken(minted.token) }),
      });

      expect(add).toHaveBeenCalledWith(1, {
        tenant: "uniswap",
        name: "prod mcp",
        result: "valid",
      });
    });

    it("buckets user tenants to user:* to bound the metric's cardinality", async () => {
      const add = vi.spyOn(tokenValidationRequestTotal, "add");
      const minted = await mint({ tenant: "user:1", name: "my-agent" });

      await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken(minted.token) }),
      });

      expect(add).toHaveBeenCalledWith(1, {
        tenant: "user:*",
        name: "my-agent",
        result: "valid",
      });
    });

    it("rejects an unknown hash", async () => {
      const add = vi.spyOn(tokenValidationRequestTotal, "add");
      const res = await app.request("/validate", {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ tokenHash: hashToken("never-minted") }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ valid: false });
      expect(add).toHaveBeenCalledWith(1, { result: "invalid" });
    });
  });
});
