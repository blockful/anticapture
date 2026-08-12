import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "@/repository/schema";

import { DrizzleRepository } from "./db";

function createProposal(
  overrides?: Partial<schema.OffchainProposal>,
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
    scores: [],
    scoresTotal: 0,
    quorum: 0,
    choices: [],
    network: "",
    snapshot: null,
    strategies: [],
    ...overrides,
  };
}

function createVote(
  overrides?: Partial<schema.OffchainVote>,
): schema.OffchainVote {
  return {
    spaceId: "ens.eth",
    voter: "0x5678",
    proposalId: "prop-1",
    choice: 1,
    vp: "100.5",
    reason: "",
    created: 1700000000,
    ...overrides,
  };
}

describe("DrizzleRepository", () => {
  let client: PGlite;
  let db: PgliteDatabase<typeof schema>;
  let repo: DrizzleRepository;

  // PGlite boots a WASM Postgres and runs migrations; on a cold, loaded CI
  // runner that can exceed the default 10s hook timeout.
  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
  }, 60_000);

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

  it("should get proposal metadata backfill batches after the cursor", async () => {
    await repo.saveProposals(
      [
        createProposal({ id: "old", created: 1000 }),
        createProposal({ id: "middle", created: 2000 }),
        createProposal({ id: "new", created: 3000 }),
      ],
      "cursor-1",
    );

    const result = await repo.getProposalMetadataBackfillBatch("1000:old", 2);

    expect(result).toStrictEqual({
      ids: ["middle", "new"],
      nextCursor: "3000:new",
    });
  });

  it("should not skip proposal metadata backfill rows sharing a created timestamp", async () => {
    await repo.saveProposals(
      [
        createProposal({ id: "a", created: 1000 }),
        createProposal({ id: "b", created: 1000 }),
        createProposal({ id: "c", created: 1000 }),
      ],
      "cursor-1",
    );

    const first = await repo.getProposalMetadataBackfillBatch(null, 2);
    const second = await repo.getProposalMetadataBackfillBatch(
      first.nextCursor,
      2,
    );

    expect(first).toStrictEqual({
      ids: ["a", "b"],
      nextCursor: "1000:b",
    });
    expect(second).toStrictEqual({
      ids: ["c"],
      nextCursor: "1000:c",
    });
  });

  describe("proposals", () => {
    it("should save the proposals", async () => {
      const proposal = createProposal({ id: "prop-1", title: "Test Proposal" });

      await repo.saveProposals([proposal], "cursor-1");

      const rows = await db.select().from(schema.proposals);
      expect(rows).toStrictEqual([
        {
          author: "0x1234",
          body: "Proposal body",
          choices: [],
          created: 1700000000,
          discussion: "",
          end: 1700100000,
          flagged: false,
          id: "prop-1",
          link: "",
          network: "",
          quorum: 0,
          scores: [],
          scoresTotal: 0,
          snapshot: null,
          spaceId: "ens.eth",
          start: 1700000000,
          state: "active",
          strategies: [],
          title: "Test Proposal",
          type: "single-choice",
          updated: 1700000000,
        },
      ]);
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
        scores: [10, 1],
        scoresTotal: 11,
        quorum: 10,
      });
      await repo.saveProposals([updated], "cursor-2");

      const rows = await db.select().from(schema.proposals);
      expect(rows).toStrictEqual([
        {
          author: "0x1234",
          body: "Proposal body",
          choices: [],
          created: 1700000000,
          discussion: "",
          end: 1700100000,
          flagged: false,
          id: "prop-1",
          link: "",
          network: "",
          quorum: 10,
          scores: [10, 1],
          scoresTotal: 11,
          snapshot: null,
          spaceId: "ens.eth",
          start: 1700000000,
          state: "closed",
          strategies: [],
          title: "Updated Title",
          type: "single-choice",
          updated: 1700000000,
        },
      ]);
    });

    it("should upsert proposal metadata backfill without changing proposal cursor", async () => {
      await repo.saveProposals(
        [createProposal({ id: "prop-1", title: "Original Title" })],
        "proposal-cursor",
      );

      await repo.saveProposalMetadataBackfill(
        [
          createProposal({
            id: "prop-1",
            title: "Backfilled Title",
            state: "closed",
            scores: [5_347_713.99, 0, 1_813.59],
            scoresTotal: 5_349_527,
            quorum: 10_000_000,
          }),
        ],
        "metadata-cursor",
      );

      const rows = await db.select().from(schema.proposals);
      expect(rows).toStrictEqual([
        {
          author: "0x1234",
          body: "Proposal body",
          choices: [],
          created: 1700000000,
          discussion: "",
          end: 1700100000,
          flagged: false,
          id: "prop-1",
          link: "",
          network: "",
          quorum: 10_000_000,
          scores: [5_347_713.99, 0, 1_813.59],
          scoresTotal: 5_349_527,
          snapshot: null,
          spaceId: "ens.eth",
          start: 1700000000,
          state: "closed",
          strategies: [],
          title: "Backfilled Title",
          type: "single-choice",
          updated: 1700000000,
        },
      ]);
      expect(await repo.getLastCursor("proposals")).toBe("proposal-cursor");
      expect(await repo.getLastCursor("proposal_metadata_backfill")).toBe(
        "metadata-cursor",
      );
    });

    it("should get proposal ids created at or after the cutoff", async () => {
      await repo.saveProposals(
        [
          createProposal({ id: "prop-1", created: 1700000000 }),
          createProposal({ id: "prop-2", created: 1700000000 }),
        ],
        "cursor-1",
      );

      const ids = await repo.getProposalIdsSince(0);

      expect(ids.sort()).toStrictEqual(["prop-1", "prop-2"]);
    });

    it("should exclude proposal ids created before the cutoff", async () => {
      await repo.saveProposals(
        [
          createProposal({ id: "old", created: 1000 }),
          createProposal({ id: "recent", created: 2000 }),
        ],
        "cursor-1",
      );

      const ids = await repo.getProposalIdsSince(2000);

      expect(ids).toStrictEqual(["recent"]);
    });

    describe("getRevealPendingProposalIds", () => {
      const NOW = 1700200000;
      const ENDED_SINCE = NOW - 14 * 24 * 60 * 60;

      it("should select a closed proposal whose tally is still all zeros", async () => {
        await repo.saveProposals(
          [
            createProposal({ id: "pending", end: NOW - 60, scores: [0, 0] }),
            createProposal({ id: "revealed", end: NOW - 60, scores: [400, 1] }),
          ],
          "cursor-1",
        );

        const ids = await repo.getRevealPendingProposalIds(ENDED_SINCE, NOW);

        expect(ids).toStrictEqual(["pending"]);
      });

      // The window is on `end`, not `created`: a proposal that ran longer than
      // the window still needs its reveal re-read once voting closes.
      it("should select a long-running proposal created before the window but ended inside it", async () => {
        await repo.saveProposals(
          [
            createProposal({
              id: "long-running",
              created: ENDED_SINCE - 365 * 24 * 60 * 60,
              end: NOW - 3600,
              scores: [0],
            }),
          ],
          "cursor-1",
        );

        const ids = await repo.getRevealPendingProposalIds(ENDED_SINCE, NOW);

        expect(ids).toStrictEqual(["long-running"]);
      });

      it("should exclude proposals still open and proposals that ended before the window", async () => {
        await repo.saveProposals(
          [
            createProposal({ id: "open", end: NOW + 3600, scores: [0] }),
            createProposal({ id: "stale", end: ENDED_SINCE - 1, scores: [0] }),
          ],
          "cursor-1",
        );

        const ids = await repo.getRevealPendingProposalIds(ENDED_SINCE, NOW);

        expect(ids).toStrictEqual([]);
      });
    });

    it("should delete proposals and their votes", async () => {
      await repo.saveProposals(
        [createProposal({ id: "prop-1" }), createProposal({ id: "prop-2" })],
        "cursor-1",
      );
      await repo.saveVotes(
        [
          createVote({ proposalId: "prop-1", voter: "0xabc" }),
          createVote({ proposalId: "prop-2", voter: "0xdef" }),
        ],
        "cursor-1",
      );

      await repo.deleteProposals(["prop-1"]);

      const proposals = await db.select().from(schema.proposals);
      const votes = await db.select().from(schema.votes);
      expect(proposals.map((proposal) => proposal.id)).toStrictEqual([
        "prop-2",
      ]);
      expect(votes.map((vote) => vote.proposalId)).toStrictEqual(["prop-2"]);
    });
  });

  describe("votes", () => {
    it("should save the votes", async () => {
      const vote = createVote({ voter: "0xabc" });

      await repo.saveVotes([vote], "cursor-1");

      const rows = await db.select().from(schema.votes);
      expect(rows).toStrictEqual([
        {
          choice: 1,
          created: 1700000000,
          proposalId: "prop-1",
          reason: "",
          spaceId: "ens.eth",
          voter: "0xabc",
          vp: "100.5",
        },
      ]);
    });

    it("should skip saving if the votes are empty", async () => {
      await repo.saveVotes([], "cursor-1");

      const rows = await db.select().from(schema.votes);
      expect(rows).toHaveLength(0);

      const cursor = await repo.getLastCursor("votes");
      expect(cursor).toBeNull();
    });

    it("should upsert on conflict (revote scenario)", async () => {
      const vote = createVote({
        voter: "0xabc",
        proposalId: "prop-1",
        choice: 1,
        vp: "100.5",
        reason: "original reason",
        created: 1700000000,
      });
      await repo.saveVotes([vote], "cursor-1");

      const revote = createVote({
        voter: "0xabc",
        proposalId: "prop-1",
        choice: 2,
        vp: "250",
        reason: "changed my mind",
        created: 1700005000,
      });
      await repo.saveVotes([revote], "cursor-2");

      const rows = await db.select().from(schema.votes);
      expect(rows).toHaveLength(1);
      expect(rows).toStrictEqual([
        {
          choice: 2,
          created: 1700005000,
          proposalId: "prop-1",
          reason: "changed my mind",
          spaceId: "ens.eth",
          voter: "0xabc",
          vp: "250",
        },
      ]);
    });
  });
});
