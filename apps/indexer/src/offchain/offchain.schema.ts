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
    accountId: text("account_id").notNull(),
    daoId: text("dao_id").notNull(),
    signature: text("signature").notNull(),
    message: text("message").notNull(),
    timestamp: bigint("timestamp", { mode: "bigint" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.daoId] })],
);
