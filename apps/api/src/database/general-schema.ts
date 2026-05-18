import { pgSchema, index, bigint } from "drizzle-orm/pg-core";

export const generalSchema = pgSchema("general");

export const proposalDrafts = generalSchema.table(
  "proposal_drafts",
  (d) => ({
    id: d.text().primaryKey(),
    daoId: d.text("dao_id").notNull(),
    author: d.text().notNull(),
    title: d.text().notNull().default(""),
    discussionUrl: d.text("discussion_url").notNull().default(""),
    body: d.text().notNull().default(""),
    actions: d.jsonb().$type<unknown[]>().notNull().default([]),
    createdAt: bigint("created_at", { mode: "bigint" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "bigint" }).notNull(),
  }),
  (table) => [index().on(table.author), index().on(table.daoId)],
);
