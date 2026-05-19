import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { GeneralDrizzle } from "@/database";
import * as generalSchema from "@/database/general-schema";
import { proposalDrafts } from "@/database/general-schema";
import { DraftProposalsRepository } from "@/repositories/draft-proposals";
import { DraftProposalsService } from "@/services/draft-proposals";
import { draftProposals } from ".";

const DAO_ID = "ens";
const ADDRESS_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ADDRESS_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

type DraftInsert = typeof proposalDrafts.$inferInsert;

const makeDraft = (overrides: Partial<DraftInsert> = {}): DraftInsert => ({
  id: crypto.randomUUID(),
  daoId: DAO_ID,
  author: ADDRESS_A,
  title: "Test draft",
  discussionUrl: "https://example.com",
  body: "Draft body",
  actions: [],
  createdAt: BigInt(Date.now()),
  updatedAt: BigInt(Date.now()),
  ...overrides,
});

describe("draftProposals controller", () => {
  let client: PGlite;
  let db: GeneralDrizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema: generalSchema });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(generalSchema, db as any);
    await apply();

    const repo = new DraftProposalsRepository(db);
    const service = new DraftProposalsService(repo);
    app = new Hono();
    draftProposals(app, service, DAO_ID);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(proposalDrafts);
  });

  describe("GET /proposal-drafts", () => {
    it("returns an empty list when no drafts exist for the address", async () => {
      const res = await app.request(`/proposal-drafts?address=${ADDRESS_A}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ items: [] });
    });

    it("returns drafts belonging to the given address", async () => {
      const draft = makeDraft();
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts?address=${ADDRESS_A}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].id).toBe(draft.id);
      expect(body.items[0].title).toBe(draft.title);
    });

    it("does not return drafts belonging to a different address", async () => {
      await db.insert(proposalDrafts).values(makeDraft({ author: ADDRESS_B }));

      const res = await app.request(`/proposal-drafts?address=${ADDRESS_A}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(0);
    });

    it("returns 400 when address query param is missing", async () => {
      const res = await app.request("/proposal-drafts");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /proposal-drafts/:id", () => {
    it("returns the draft for any caller (public share endpoint)", async () => {
      const draft = makeDraft({ author: ADDRESS_A });
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts/${draft.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(draft.id);
      expect(body.author).toBe(ADDRESS_A);
    });

    it("returns 404 when the draft does not exist", async () => {
      const res = await app.request(`/proposal-drafts/${crypto.randomUUID()}`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /proposal-drafts", () => {
    it("creates a draft and returns 201 with the saved data", async () => {
      const id = crypto.randomUUID();
      const res = await app.request("/proposal-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          address: ADDRESS_A,
          title: "My proposal",
          body: "Proposal body text",
          discussionUrl: "https://forum.example.com",
          actions: [],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe(id);
      expect(body.title).toBe("My proposal");
      expect(body.author).toBe(ADDRESS_A);
      expect(body.daoId).toBe(DAO_ID);
    });

    it("stores the author address in lowercase", async () => {
      const id = crypto.randomUUID();
      const mixedCaseAddress = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

      const res = await app.request("/proposal-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          address: mixedCaseAddress,
          title: "",
          body: "",
          discussionUrl: "",
          actions: [],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.author).toBe(mixedCaseAddress.toLowerCase());
    });

    it("returns 400 when id is not a valid UUID", async () => {
      const res = await app.request("/proposal-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: "not-a-uuid",
          address: ADDRESS_A,
          title: "",
          body: "",
          discussionUrl: "",
          actions: [],
        }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await app.request("/proposal-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /proposal-drafts/:id", () => {
    it("updates a draft owned by the address", async () => {
      const draft = makeDraft();
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts/${draft.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: ADDRESS_A, title: "Updated title" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Updated title");
      expect(body.id).toBe(draft.id);
    });

    it("returns 404 when address does not match the draft author", async () => {
      const draft = makeDraft({ author: ADDRESS_A });
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts/${draft.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: ADDRESS_B, title: "Hijacked" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 404 when the draft does not exist", async () => {
      const res = await app.request(`/proposal-drafts/${crypto.randomUUID()}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: ADDRESS_A, title: "Ghost" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns 400 when address is missing from body", async () => {
      const draft = makeDraft();
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts/${draft.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "No address" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /proposal-drafts/:id", () => {
    it("deletes a draft owned by the address and returns 204", async () => {
      const draft = makeDraft();
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(
        `/proposal-drafts/${draft.id}?address=${ADDRESS_A}`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(204);

      const check = await app.request(`/proposal-drafts/${draft.id}`);
      expect(check.status).toBe(404);
    });

    it("returns 404 when address does not match the draft author", async () => {
      const draft = makeDraft({ author: ADDRESS_A });
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(
        `/proposal-drafts/${draft.id}?address=${ADDRESS_B}`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 when the draft does not exist", async () => {
      const res = await app.request(
        `/proposal-drafts/${crypto.randomUUID()}?address=${ADDRESS_A}`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when address query param is missing", async () => {
      const draft = makeDraft();
      await db.insert(proposalDrafts).values(draft);

      const res = await app.request(`/proposal-drafts/${draft.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(400);
    });
  });
});
