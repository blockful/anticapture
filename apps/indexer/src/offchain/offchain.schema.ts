import { bigint, pgSchema, primaryKey, text } from "drizzle-orm/pg-core";

export const offchainSchema = pgSchema("offchain");

// Note: right now it's impossible to import from "ponder" because
// it doesn't have a cjs export (which drizzle-kit uses).
//
// However, the ponder bigint and hex columns are simple aliases
// for numeric(78) and text respectively.

export const petitionSignatures = offchainSchema.table(
  "petition_signatures",
  {
    accountId: text().notNull(),
    daoId: text().notNull(),
    signature: text().notNull(),
    message: text().notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.accountId, table.daoId] }),
  }),
);
