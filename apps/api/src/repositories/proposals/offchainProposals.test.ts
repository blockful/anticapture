import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import * as offchainSchema from "@/database/offchain-schema";
import { offchainProposals } from "@/database/offchain-schema";

import { OffchainProposalRepository } from "./offchainProposals";

type ProposalInsert = typeof offchainProposals.$inferInsert;

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "default-proposal",
  spaceId: "ens.eth",
  author: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Proposal",
  body: "Test body content",
  discussion: "",
  type: "single-choice",
  start: 1700000000,
  end: 1700086400,
  state: "active",
  created: 1700000000,
  updated: 1700000000,
  link: "https://snapshot.org/#/proposal/1",
  flagged: false,
  ...overrides,
});

describe("OffchainProposalRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof offchainSchema>>;
  let repository: OffchainProposalRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema: offchainSchema });
    repository = new OffchainProposalRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(offchainSchema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(offchainProposals);
  });

  describe("getProposals", () => {
    it("should return proposals ordered by created desc by default", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", title: "First", created: 1000 }),
          createProposal({ id: "p2", title: "Second", created: 3000 }),
          createProposal({ id: "p3", title: "Third", created: 2000 }),
        ]);

      const result = await repository.getProposals(
        0,
        10,
        "desc",
        undefined,
        undefined,
      );

      expect(result.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
    });

    it("should return empty array when no data", async () => {
      const result = await repository.getProposals(
        0,
        10,
        "desc",
        undefined,
        undefined,
      );

      expect(result).toEqual([]);
    });

    it("should filter by state with", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", state: "active" }),
          createProposal({ id: "p2", state: "closed" }),
          createProposal({ id: "p3", state: "active" }),
        ]);

      const result = await repository.getProposals(
        0,
        10,
        "desc",
        ["ACTIVE"],
        undefined,
      );

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.state === "active")).toBe(true);
    });

    it("should filter by fromDate", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", created: 1000 }),
          createProposal({ id: "p2", created: 2000 }),
          createProposal({ id: "p3", created: 3000 }),
        ]);

      const result = await repository.getProposals(
        0,
        10,
        "desc",
        undefined,
        2000,
      );

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(["p3", "p2"]);
    });

    it("should order ascending", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", created: 3000 }),
          createProposal({ id: "p2", created: 1000 }),
          createProposal({ id: "p3", created: 2000 }),
        ]);

      const result = await repository.getProposals(
        0,
        10,
        "asc",
        undefined,
        undefined,
      );

      expect(result.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
    });

    it("should apply skip", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", created: 3000 }),
          createProposal({ id: "p2", created: 2000 }),
          createProposal({ id: "p3", created: 1000 }),
        ]);

      const result = await repository.getProposals(
        1,
        10,
        "desc",
        undefined,
        undefined,
      );

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(["p2", "p3"]);
    });

    it("should apply limit", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", created: 3000 }),
          createProposal({ id: "p2", created: 2000 }),
          createProposal({ id: "p3", created: 1000 }),
        ]);

      const result = await repository.getProposals(
        0,
        2,
        "desc",
        undefined,
        undefined,
      );

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
    });

    it("should combine state and fromDate filters", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", state: "active", created: 1000 }),
          createProposal({ id: "p2", state: "active", created: 3000 }),
          createProposal({ id: "p3", state: "closed", created: 3000 }),
        ]);

      const result = await repository.getProposals(
        0,
        10,
        "desc",
        ["active"],
        2000,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("p2");
    });
  });

  describe("getProposalById", () => {
    it("should return proposal when found", async () => {
      const inserted = createProposal({ id: "find-me", title: "Found" });
      await db.insert(offchainProposals).values(inserted);

      const result = await repository.getProposalById("find-me");

      expect(result).toBeDefined();
      expect(result!.id).toBe("find-me");
    });

    it("should return undefined when not found", async () => {
      const result = await repository.getProposalById("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("getProposalsCount", () => {
    it("should return count matching filters", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1", state: "active", created: 1000 }),
          createProposal({ id: "p2", state: "active", created: 3000 }),
          createProposal({ id: "p3", state: "closed", created: 3000 }),
        ]);

      const count = await repository.getProposalsCount(["active"], 2000);

      expect(count).toBe(1);
    });

    it("should return 0 when no data", async () => {
      const count = await repository.getProposalsCount();

      expect(count).toBe(0);
    });

    it("should return total count without filters", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: "p1" }),
          createProposal({ id: "p2" }),
          createProposal({ id: "p3" }),
        ]);

      const count = await repository.getProposalsCount();

      expect(count).toBe(3);
    });
  });
});
