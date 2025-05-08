import { bigint, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const petitionSignatures = pgTable(
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
