import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { recoverMessageAddress } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z, type ZodType } from "zod";

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
import { DraftListResponseSchema, DraftResponseSchema } from "@/mappers/drafts";
import { ErrorResponseSchema } from "@/mappers/errors";
import { DraftsRepository } from "@/repositories/drafts";
import { ProposalDraftsService } from "@/services/drafts";

// better-auth's SIWE plugin has no exported response schema — this is the
// only shape this suite reads from it.
const NonceResponseSchema = z.object({ nonce: z.string() });

// Runtime-validates every response body against its route's own zod schema
// instead of casting, so a controller/schema mismatch fails the test.
async function readJson<T>(res: Response, schema: ZodType<T>): Promise<T> {
  return schema.parse(await res.json());
}

const HOST = "localhost:3000";
const ORIGIN = `http://${HOST}`;
const DAO_ID = "ens";

// Offline EOA verifier — production injects viem's publicClient.verifyMessage
// (EIP-1271 capable); tests must not hit an RPC.
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

describe("drafts + SIWE session integration", () => {
  let client: PGlite;
  let app: TestApp;
  let quotaApp: TestApp;

  beforeAll(async () => {
    client = new PGlite();
    const db = drizzle(client, { schema: fullSchema });
    // Only actual tables — the generated auth-schema also exports relations.
    const tables = {
      user,
      session,
      account,
      verification,
      walletAddress,
      drafts,
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

    const repo = new DraftsRepository(db);
    app = createApp({
      db,
      authResolver,
      draftsService: new ProposalDraftsService(repo),
    });
    // Same DB, tiny quota — exercises the limit without 100 inserts.
    quotaApp = createApp({
      db,
      authResolver,
      draftsService: new ProposalDraftsService(repo, 2),
    });
  });

  afterAll(async () => {
    await client.close();
  });

  const baseHeaders = { host: HOST, origin: ORIGIN };

  const signIn = async (wallet: ReturnType<typeof privateKeyToAccount>) => {
    const nonceRes = await app.request("/api/auth/siwe/nonce", {
      method: "POST",
      headers: { ...baseHeaders, "content-type": "application/json" },
      body: JSON.stringify({ walletAddress: wallet.address, chainId: 1 }),
    });
    expect(nonceRes.status).toBe(200);
    const { nonce } = await readJson(nonceRes, NonceResponseSchema);

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
    expect(verifyRes.status).toBe(200);

    const setCookies = verifyRes.headers.getSetCookie();
    expect(setCookies.length).toBeGreaterThan(0);
    const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    return { cookie, address: wallet.address };
  };

  const newWallet = () => privateKeyToAccount(generatePrivateKey());

  const authed = (cookie: string, extra: Record<string, string> = {}) => ({
    ...baseHeaders,
    cookie,
    ...extra,
  });

  const createDraft = async (
    cookie: string,
    body: Record<string, unknown> = {},
    target: TestApp = app,
  ) =>
    target.request("/drafts", {
      method: "POST",
      headers: authed(cookie, { "content-type": "application/json" }),
      body: JSON.stringify({ daoId: DAO_ID, title: "t", ...body }),
    });

  it("signs in via SIWE and issues a session cookie", async () => {
    const { cookie } = await signIn(newWallet());
    expect(cookie).toContain("better-auth");
  });

  it("rejects drafts routes without a session", async () => {
    const res = await app.request(`/drafts?daoId=${DAO_ID}`, {
      headers: baseHeaders,
    });
    expect(res.status).toBe(401);
  });

  it("rejects requests from hosts outside the allowlist", async () => {
    const res = await app.request(`/drafts?daoId=${DAO_ID}`, {
      headers: { host: "evil.example", origin: "http://evil.example" },
    });
    expect(res.status).toBe(400);
    await expect(readJson(res, ErrorResponseSchema)).resolves.toEqual({
      error: "untrusted_host",
    });
  });

  it("creates a draft with a server-generated id and the author wallet", async () => {
    const wallet = newWallet();
    const { cookie } = await signIn(wallet);

    const res = await createDraft(cookie, { title: "My proposal" });
    expect(res.status).toBe(201);
    const draft = await readJson(res, DraftResponseSchema);

    expect(draft.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(draft.authorAddress).toBe(wallet.address.toLowerCase());
    expect(draft.isOwner).toBe(true);
    expect(draft.daoId).toBe(DAO_ID);
  });

  it("rejects oversized draft fields", async () => {
    const { cookie } = await signIn(newWallet());
    const res = await createDraft(cookie, { title: "x".repeat(301) });
    expect(res.status).toBe(400);
  });

  it("ignores a client-supplied id on create", async () => {
    const { cookie } = await signIn(newWallet());
    const res = await createDraft(cookie, {
      id: "11111111-1111-1111-1111-111111111111",
    });
    expect(res.status).toBe(201);
    const draft = await readJson(res, DraftResponseSchema);
    expect(draft.id).not.toBe("11111111-1111-1111-1111-111111111111");
  });

  it("lists only the session user's drafts for the requested dao", async () => {
    const alice = await signIn(newWallet());
    const bob = await signIn(newWallet());

    const created = await readJson(
      await createDraft(alice.cookie),
      DraftResponseSchema,
    );
    await createDraft(alice.cookie, { daoId: "shu" });
    await createDraft(bob.cookie);

    const res = await app.request(`/drafts?daoId=${DAO_ID}`, {
      headers: authed(alice.cookie),
    });
    expect(res.status).toBe(200);
    const { items } = await readJson(res, DraftListResponseSchema);

    expect(items.some((d) => d.id === created.id)).toBe(true);
    expect(items.every((d) => d.daoId === DAO_ID)).toBe(true);
    expect(items.every((d) => d.isOwner)).toBe(true);
  });

  it("serves the share endpoint publicly with isOwner from the session", async () => {
    const owner = await signIn(newWallet());
    const other = await signIn(newWallet());
    const draft = await readJson(
      await createDraft(owner.cookie),
      DraftResponseSchema,
    );

    const anonymous = await app.request(`/drafts/${draft.id}`, {
      headers: baseHeaders,
    });
    expect(anonymous.status).toBe(200);
    await expect(
      readJson(anonymous, DraftResponseSchema),
    ).resolves.toMatchObject({
      isOwner: false,
    });

    const asOwner = await app.request(`/drafts/${draft.id}`, {
      headers: authed(owner.cookie),
    });
    await expect(readJson(asOwner, DraftResponseSchema)).resolves.toMatchObject(
      {
        isOwner: true,
      },
    );

    const asOther = await app.request(`/drafts/${draft.id}`, {
      headers: authed(other.cookie),
    });
    await expect(readJson(asOther, DraftResponseSchema)).resolves.toMatchObject(
      {
        isOwner: false,
      },
    );
  });

  it("returns identical 404s for foreign and nonexistent drafts (no oracle)", async () => {
    const owner = await signIn(newWallet());
    const attacker = await signIn(newWallet());
    const draft = await readJson(
      await createDraft(owner.cookie),
      DraftResponseSchema,
    );

    const patch = () => ({
      method: "PUT",
      headers: authed(attacker.cookie, { "content-type": "application/json" }),
      body: JSON.stringify({ title: "hijacked" }),
    });
    const foreign = await app.request(`/drafts/${draft.id}`, patch());
    const missing = await app.request(
      "/drafts/00000000-0000-4000-8000-000000000000",
      patch(),
    );

    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    await expect(readJson(foreign, ErrorResponseSchema)).resolves.toEqual(
      await readJson(missing, ErrorResponseSchema),
    );

    // And the draft is untouched.
    const check = await app.request(`/drafts/${draft.id}`, {
      headers: baseHeaders,
    });
    await expect(readJson(check, DraftResponseSchema)).resolves.toMatchObject({
      title: "t",
    });
  });

  it("lets the owner update and delete", async () => {
    const owner = await signIn(newWallet());
    const draft = await readJson(
      await createDraft(owner.cookie),
      DraftResponseSchema,
    );

    const updated = await app.request(`/drafts/${draft.id}`, {
      method: "PUT",
      headers: authed(owner.cookie, { "content-type": "application/json" }),
      body: JSON.stringify({ title: "updated" }),
    });
    expect(updated.status).toBe(200);
    await expect(readJson(updated, DraftResponseSchema)).resolves.toMatchObject(
      {
        title: "updated",
      },
    );

    const foreignDelete = await app.request(`/drafts/${draft.id}`, {
      method: "DELETE",
      headers: authed((await signIn(newWallet())).cookie),
    });
    expect(foreignDelete.status).toBe(404);

    const deleted = await app.request(`/drafts/${draft.id}`, {
      method: "DELETE",
      headers: authed(owner.cookie),
    });
    expect(deleted.status).toBe(204);

    const gone = await app.request(`/drafts/${draft.id}`, {
      headers: baseHeaders,
    });
    expect(gone.status).toBe(404);
  });

  it("enforces the per-user draft quota", async () => {
    const { cookie } = await signIn(newWallet());

    expect((await createDraft(cookie, {}, quotaApp)).status).toBe(201);
    expect((await createDraft(cookie, {}, quotaApp)).status).toBe(201);

    const third = await createDraft(cookie, {}, quotaApp);
    expect(third.status).toBe(403);
    await expect(readJson(third, ErrorResponseSchema)).resolves.toEqual({
      error: "draft_limit_reached",
    });
  });

  it("claims migrated unclaimed drafts on first list (case-insensitive)", async () => {
    const wallet = newWallet();
    const db = drizzle(client, { schema: fullSchema });
    // Simulates a row bulk-copied from a DAO DB: no owner yet, author address
    // in mixed case, original id preserved.
    const [migrated] = await db
      .insert(drafts)
      .values({
        userId: null,
        authorAddress: wallet.address, // checksummed casing on purpose
        daoId: DAO_ID,
        title: "migrated draft",
        discussionUrl: "",
        body: "",
        actions: [],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
      .returning();

    const { cookie } = await signIn(wallet);
    const res = await app.request(`/drafts?daoId=${DAO_ID}`, {
      headers: authed(cookie),
    });
    const { items } = await readJson(res, DraftListResponseSchema);

    const claimed = items.find((d) => d.id === migrated!.id);
    expect(claimed).toBeDefined();
    expect(claimed!.isOwner).toBe(true);
    expect(claimed!.title).toBe("migrated draft");
  });

  it("rejects a create without daoId", async () => {
    const { cookie } = await signIn(newWallet());
    const res = await app.request("/drafts", {
      method: "POST",
      headers: authed(cookie, { "content-type": "application/json" }),
      body: JSON.stringify({ title: "no dao" }),
    });
    expect(res.status).toBe(400);
  });
});
