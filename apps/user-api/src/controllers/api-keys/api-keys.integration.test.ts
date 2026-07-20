import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { recoverMessageAddress } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createApp } from "@/app";
import { createAuthResolver } from "@/auth";
import type { AuthfulClient } from "@/clients/authful";
import * as fullSchema from "@/database/schema";
import {
  account,
  drafts,
  session,
  user,
  userApiKeys,
  verification,
  walletAddress,
} from "@/database/schema";
import {
  ApiKeyListResponseSchema,
  CreatedApiKeyResponseSchema,
} from "@/mappers/api-keys";
import { ApiKeysRepository } from "@/repositories/api-keys";
import { DraftsRepository } from "@/repositories/drafts";
import { ApiKeysService } from "@/services/api-keys";
import { ProposalDraftsService } from "@/services/drafts";

const HOST = "localhost:3000";
const ORIGIN = `http://${HOST}`;

const verifyMessage = async ({
  message,
  signature,
  address,
}: {
  message: string;
  signature: string;
  address: string;
}) => {
  const recovered = await recoverMessageAddress({
    message,
    signature: signature as `0x${string}`,
  });
  return recovered.toLowerCase() === address.toLowerCase();
};

type TestApp = ReturnType<typeof createApp>;

describe("api-keys + Authful brokering integration", () => {
  let client: PGlite;
  let app: TestApp;

  // Fake Authful: records mint/revoke calls, returns a deterministic plaintext.
  // listByTenant reports a fixed lastUsedAt so the enrichment path is covered.
  const authful: AuthfulClient & {
    mint: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
    listByTenant: ReturnType<typeof vi.fn>;
  } = {
    mint: vi.fn(async (tenant: string) => ({
      id: crypto.randomUUID(),
      token: `act_${tenant}`,
    })),
    revoke: vi.fn(async () => undefined),
    listByTenant: vi.fn(async () => []),
  };

  beforeAll(async () => {
    client = new PGlite();
    const db = drizzle(client, { schema: fullSchema });
    const tables = {
      user,
      session,
      account,
      verification,
      walletAddress,
      drafts,
      userApiKeys,
    };
    // drizzle-kit's PgDatabase generic can't unify with our schema's inferred
    // relations type; this is a drizzle-kit typing gap, not a test-side any.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { apply } = await pushSchema(tables, db as any);
    await apply();

    const authResolver = createAuthResolver({
      db,
      secret: "integration-test-secret-0123456789abcdef",
      domains: [HOST],
      verifyMessage,
    });

    app = createApp({
      db,
      authResolver,
      draftsService: new ProposalDraftsService(new DraftsRepository(db)),
      // small quota to exercise the limit
      apiKeysService: new ApiKeysService(new ApiKeysRepository(db), authful, 2),
    });
  });

  afterAll(async () => {
    await client.close();
  });

  const baseHeaders = { host: HOST, origin: ORIGIN };

  const signIn = async () => {
    const wallet = privateKeyToAccount(generatePrivateKey());
    const nonceRes = await app.request("/api/auth/siwe/nonce", {
      method: "POST",
      headers: { ...baseHeaders, "content-type": "application/json" },
      body: JSON.stringify({ walletAddress: wallet.address, chainId: 1 }),
    });
    const { nonce } = (await nonceRes.json()) as { nonce: string };
    const message = createSiweMessage({
      domain: HOST,
      address: wallet.address,
      chainId: 1,
      nonce,
      uri: ORIGIN,
      version: "1",
    });
    const signature = await wallet.signMessage({ message });
    const verifyRes = await app.request("/api/auth/siwe/verify", {
      method: "POST",
      headers: { ...baseHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        message,
        signature,
        walletAddress: wallet.address,
        chainId: 1,
      }),
    });
    const cookie = verifyRes.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    return cookie;
  };

  const authed = (cookie: string, extra: Record<string, string> = {}) => ({
    ...baseHeaders,
    cookie,
    ...extra,
  });

  const createKey = (cookie: string, label = "my-agent") =>
    app.request("/me/api-keys", {
      method: "POST",
      headers: authed(cookie, { "content-type": "application/json" }),
      body: JSON.stringify({ label }),
    });

  it("requires a session", async () => {
    const res = await app.request("/me/api-keys", { headers: baseHeaders });
    expect(res.status).toBe(401);
  });

  it("mints via Authful under the user's tenant and returns plaintext once", async () => {
    const cookie = await signIn();
    const res = await createKey(cookie, "prod-agent");
    expect(res.status).toBe(201);
    // Route schema as the contract check — a drifted response shape fails
    // the parse instead of sliding through an untyped cast.
    const body = CreatedApiKeyResponseSchema.parse(await res.json());

    expect(body.label).toBe("prod-agent");
    expect(body.token).toMatch(/^act_user:/); // tenant = user:<id>
    expect(authful.mint).toHaveBeenCalledWith(
      expect.stringMatching(/^user:/),
      "self-service",
    );
  });

  it("lists the session user's keys without the plaintext", async () => {
    const cookie = await signIn();
    await createKey(cookie, "a");
    const res = await app.request("/me/api-keys", { headers: authed(cookie) });
    // Raw JSON shape (no schema parse here — zod would strip an accidental
    // `token` field and defeat the leak assertion below).
    const { items } = (await res.json()) as {
      items: Record<string, unknown>[];
    };

    expect(items.length).toBe(1);
    expect(items[0]!.label).toBe("a");
    expect(items[0]).not.toHaveProperty("token");
    expect(items[0]).toHaveProperty("lastUsedAt");
  });

  it("surfaces lastUsedAt from Authful for the listed keys", async () => {
    const cookie = await signIn();
    await createKey(cookie, "used");
    const mintedId = (await authful.mint.mock.results.at(-1)!.value).id;
    authful.listByTenant.mockResolvedValueOnce([
      { id: mintedId, lastUsedAt: "2026-01-02T03:04:05.000Z" },
    ]);

    const res = await app.request("/me/api-keys", { headers: authed(cookie) });
    const { items } = ApiKeyListResponseSchema.parse(await res.json());
    const used = items.find((k) => k.label === "used");
    expect(used?.lastUsedAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("still lists keys when Authful is unreachable (lastUsedAt null)", async () => {
    const cookie = await signIn();
    await createKey(cookie, "resilient");
    authful.listByTenant.mockRejectedValueOnce(new Error("authful down"));

    const res = await app.request("/me/api-keys", { headers: authed(cookie) });
    expect(res.status).toBe(200);
    const { items } = ApiKeyListResponseSchema.parse(await res.json());
    expect(items.find((k) => k.label === "resilient")).toBeTruthy();
  });

  it("does not list another user's keys", async () => {
    const alice = await signIn();
    const bob = await signIn();
    await createKey(alice, "alice-key");

    const res = await app.request("/me/api-keys", { headers: authed(bob) });
    const { items } = ApiKeyListResponseSchema.parse(await res.json());
    expect(items).toHaveLength(0);
  });

  it("revokes in Authful then locally, and 404s a foreign key", async () => {
    const owner = await signIn();
    const attacker = await signIn();
    const created = CreatedApiKeyResponseSchema.parse(
      await (await createKey(owner, "temp")).json(),
    );

    // Attacker cannot revoke it — 404, and Authful is never called.
    authful.revoke.mockClear();
    const foreign = await app.request(`/me/api-keys/${created.id}`, {
      method: "DELETE",
      headers: authed(attacker),
    });
    expect(foreign.status).toBe(404);
    expect(authful.revoke).not.toHaveBeenCalled();

    // Owner revokes — Authful called, key drops from the list.
    const res = await app.request(`/me/api-keys/${created.id}`, {
      method: "DELETE",
      headers: authed(owner),
    });
    expect(res.status).toBe(204);
    expect(authful.revoke).toHaveBeenCalledOnce();

    const list = await app.request("/me/api-keys", { headers: authed(owner) });
    const { items } = ApiKeyListResponseSchema.parse(await list.json());
    expect(items.find((k) => k.id === created.id)).toBeUndefined();
  });

  it("enforces the per-user key quota", async () => {
    const cookie = await signIn();
    expect((await createKey(cookie)).status).toBe(201);
    expect((await createKey(cookie)).status).toBe(201);
    const third = await createKey(cookie);
    expect(third.status).toBe(403);
    await expect(third.json()).resolves.toEqual({
      error: "api_key_limit_reached",
    });
  });
});
