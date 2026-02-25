import { pgSchema, index, primaryKey } from "drizzle-orm/pg-core";

export const snapshotSchema = pgSchema("snapshot");

export const offchainProposals = snapshotSchema.table("proposals", (d) => ({
  id: d.text().primaryKey(),
  spaceId: d.text("space_id").notNull(),
  author: d.text().notNull(),
  title: d.text().notNull(),
  body: d.text().notNull(),
  discussion: d.text().notNull().default(""),
  type: d.text().notNull(),
  start: d.integer().notNull(),
  end: d.integer().notNull(),
  state: d.text().notNull(),
  created: d.integer().notNull(),
  updated: d.integer().notNull(),
  link: d.text().notNull().default(""),
  flagged: d.boolean().notNull().default(false),
}));

export const offchainVotes = snapshotSchema.table(
  "votes",
  (d) => ({
    spaceId: d.text("space_id").notNull(),
    voter: d.text().notNull(),
    proposalId: d.text("proposal_id").notNull(),
    choice: d.jsonb().notNull(),
    vp: d.real().notNull(),
    reason: d.text().notNull().default(""),
    created: d.integer().notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.proposalId, table.voter],
    }),
    index("votes_proposal_id_idx").on(table.proposalId),
    index("votes_voter_idx").on(table.voter),
  ],
);
