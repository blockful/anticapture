import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/repository/schema";
import { DrizzleRepository } from "./db";

function createProposal(
  overrides?: Partial<schema.OffchainProposal>
): schema.OffchainProposal {
  return {
    id: "prop-default",
    spaceId: "ens.eth",
    author: "0x1234",
    title: "Default Proposal",
    body: "Proposal body",
    discussion: "",
    type: "single-choice",
    start: 1700000000,
    end: 1700100000,
    state: "active",
    created: 1700000000,
    updated: 1700000000,
    link: "",
    flagged: false,
    ...overrides,
  };
}

function createVote(
  overrides?: Partial<schema.OffchainVote>
): schema.OffchainVote {
  return {
    id: "vote-default",
    spaceId: "ens.eth",
    voter: "0x5678",
    proposalId: "prop-1",
    choice: 1,
    vp: 100.5,
    reason: "",
    created: 1700000000,
    ...overrides,
  };
}

describe("DrizzleRepository", () => {
  let client: PGlite;
  let db: PgliteDatabase<typeof schema>;
  let repo: DrizzleRepository;

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });

    await migrate(db, {
      migrationsFolder: "./drizzle",
      migrationsSchema: "snapshot",
    });

    repo = new DrizzleRepository(db);
  });

  afterEach(async () => {
    await client.exec(`
      TRUNCATE "snapshot"."proposals" CASCADE;
      TRUNCATE "snapshot"."votes" CASCADE;
      TRUNCATE "snapshot"."sync_status" CASCADE;
    `);
  });

  afterAll(async () => {
    await client.close();
  });

  it("should reset the cursor", async () => {
    await repo.saveProposals([createProposal()], "cursor-1");

    await repo.resetCursor("proposals");

    const cursor = await repo.getLastCursor("proposals");
    expect(cursor).toBeNull();
  });

  it("should get the last cursor", async () => {
    await repo.saveProposals([createProposal()], "cursor-42");

    const cursor = await repo.getLastCursor("proposals");
    expect(cursor).toBe("cursor-42");
  });

  describe("proposals", () => {
    it("should save the proposals", async () => {
      const proposal = createProposal({ id: "prop-1", title: "Test Proposal" });

      await repo.saveProposals([proposal], "cursor-1");

      const rows = await db.select().from(schema.proposals);
      expect(rows).toStrictEqual([{
        "author": "0x1234",
        "body": "Proposal body",
        "created": 1700000000,
        "discussion": "",
        "end": 1700100000,
        "flagged": false,
        "id": "prop-1",
        "link": "",
        "spaceId": "ens.eth",
        "start": 1700000000,
        "state": "active",
        "title": "Test Proposal",
        "type": "single-choice",
        "updated": 1700000000,
      }]);
    });

    it("should skip saving if the proposals are empty", async () => {
      await repo.saveProposals([], "cursor-1");

      const rows = await db.select().from(schema.proposals);
      expect(rows).toHaveLength(0);

      const cursor = await repo.getLastCursor("proposals");
      expect(cursor).toBeNull();
    });

    it("should upsert on conflict", async () => {
      const proposal = createProposal({
        id: "prop-1",
        title: "Original Title",
        state: "active",
      });
      await repo.saveProposals([proposal], "cursor-1");

      const updated = createProposal({
        id: "prop-1",
        title: "Updated Title",
        state: "closed",
      });
      await repo.saveProposals([updated], "cursor-2");

      const rows = await db.select().from(schema.proposals);
      expect(rows).toStrictEqual([{
        "author": "0x1234",
        "body": "Proposal body",
        "created": 1700000000,
        "discussion": "",
        "end": 1700100000,
        "flagged": false,
        "id": "prop-1",
        "link": "",
        "spaceId": "ens.eth",
        "start": 1700000000,
        "state": "closed",
        "title": "Updated Title",
        "type": "single-choice",
        "updated": 1700000000,
      }])
    });
  });

  describe("votes", () => {
    it("should save the votes", async () => {
      const vote = createVote({ id: "vote-1", voter: "0xabc" });

      await repo.saveVotes([vote], "cursor-1");

      const rows = await db.select().from(schema.votes);
      expect(rows).toStrictEqual([{
        "choice": 1,
        "created": 1700000000,
        "id": "vote-1",
        "proposalId": "prop-1",
        "reason": "",
        "spaceId": "ens.eth",
        "voter": "0xabc",
        "vp": 100.5,
      }])
    });

    it("should skip saving if the votes are empty", async () => {
      await repo.saveVotes([], "cursor-1");

      const rows = await db.select().from(schema.votes);
      expect(rows).toHaveLength(0);

      const cursor = await repo.getLastCursor("votes");
      expect(cursor).toBeNull();
    });

    it("should upsert on conflict", async () => {
      const vote = createVote({
        id: "vote-1",
        reason: "original reason",
        vp: 100.5,
      });
      await repo.saveVotes([vote], "cursor-1");

      const updated = createVote({
        id: "vote-1",
        reason: "updated reason",
        vp: 250.0,
      });
      await repo.saveVotes([updated], "cursor-2");

      const rows = await db.select().from(schema.votes);
      expect(rows).toStrictEqual([{
        "choice": 1,
        "created": 1700000000,
        "id": "vote-1",
        "proposalId": "prop-1",
        "reason": "updated reason",
        "spaceId": "ens.eth",
        "voter": "0x5678",
        "vp": 250,
      }])
    });
  });
});
