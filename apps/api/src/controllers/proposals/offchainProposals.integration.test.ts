import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { UnifiedDrizzle } from "@/database";
import * as schema from "@/database/schema";
import * as offchainSchema from "@/database/offchain-schema";
import { offchainProposals } from "@/database/offchain-schema";
import { OffchainProposalRepository } from "@/repositories/proposals/offchainProposals";
import { OffchainProposalsService } from "@/services/proposals/offchainProposals";
import { offchainProposals as offchainProposalsController } from "./offchainProposals";

let client: PGlite;
let db: UnifiedDrizzle;
let app: Hono;

type OffchainProposalInsert = typeof offchainProposals.$inferInsert;

const createProposal = (
  overrides: Partial<OffchainProposalInsert> = {},
): OffchainProposalInsert => ({
  id: "proposal-1",
  spaceId: "ens.eth",
  author: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Proposal",
  body: "Test body",
  discussion: "",
  type: "single-choice",
  start: 1700000000,
  end: 1700086400,
  state: "active",
  created: 1700000000,
  updated: 1700000000,
  link: "",
  flagged: false,
  scores: [],
  choices: [],
  ...overrides,
});

const BASE_PROPOSAL_ITEM = {
  id: "proposal-1",
  spaceId: "ens.eth",
  author: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Proposal",
  body: "Test body",
  discussion: "",
  type: "single-choice",
  start: 1700000000,
  end: 1700086400,
  state: "active",
  created: 1700000000,
  updated: 1700000000,
  link: "",
  flagged: false,
  scores: [],
  choices: [],
  network: "",
  snapshot: null,
  strategies: [],
};

beforeAll(async () => {
  client = new PGlite();
  const unifiedSchema = { ...schema, ...offchainSchema };
  db = drizzle(client, { schema: unifiedSchema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(unifiedSchema, db as any);
  await apply();
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(offchainProposals);

  const repo = new OffchainProposalRepository(db);
  const service = new OffchainProposalsService(repo);
  app = new Hono();
  offchainProposalsController(app, service);
});

describe("Offchain Proposals Controller", () => {
  describe("GET /offchain/proposals", () => {
    it("should return 200 with correct response shape", async () => {
      const proposal = createProposal();
      await db.insert(offchainProposals).values(proposal);

      const res = await app.request("/offchain/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_PROPOSAL_ITEM], totalCount: 1 });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request("/offchain/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept query params: skip, limit, orderDirection, status, fromDate", async () => {
      await db.insert(offchainProposals).values(createProposal());

      const res = await app.request(
        "/offchain/proposals?skip=0&limit=5&orderDirection=asc&status=active&fromDate=1700000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [BASE_PROPOSAL_ITEM], totalCount: 1 });
    });

    it("should return 400 for invalid parameter", async () => {
      const res = await app.request("/offchain/proposals?skip=-1");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /offchain/proposals/{id}", () => {
    it("should return 200 with single proposal when found", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: "find-me" }));

      const res = await app.request("/offchain/proposals/find-me");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ ...BASE_PROPOSAL_ITEM, id: "find-me" });
    });

    it("should return 404 when proposal not found", async () => {
      const res = await app.request("/offchain/proposals/nonexistent");

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Proposal not found" });
    });
  });
});
