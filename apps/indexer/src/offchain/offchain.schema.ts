import { pgTable, text, bigint } from "drizzle-orm/pg-core";

/**
 * Historical treasury data from external APIs (DeFi Llama)
 * This is offchain data, not related to blockchain indexing
 */
export const historicalTreasury = pgTable("historical_treasury", {
  date: text("date").primaryKey(), // ISO format: "2024-01-15"
  totalTreasury: text("total_treasury").notNull(), // USD value as string
  treasuryWithoutDaoToken: text("treasury_without_dao_token").notNull(), // Excluding native token
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(), // Unix timestamp
});
