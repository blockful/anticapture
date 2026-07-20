import { index, pgSchema, primaryKey } from "drizzle-orm/pg-core";

export const authfulSchema = pgSchema("authful");

export const tokens = authfulSchema.table(
  "tokens",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    tenant: d.text().notNull(), // "uniswap", "blockful", ...
    name: d.text().notNull(), // human label, e.g. "uniswap mcp prod"
    tokenHash: d.text("token_hash").notNull().unique(), // sha256 hex; plaintext is never stored
    rateLimitPerMin: d.integer("rate_limit_per_min").notNull().default(600),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: d.timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: d.timestamp("last_used_at", { withTimezone: true }),
  }),
  (table) => [index().on(table.tenant)],
);

export const tokenUsageDaily = authfulSchema.table(
  "token_usage_daily",
  (d) => ({
    tokenId: d
      .uuid("token_id")
      .notNull()
      .references(() => tokens.id, { onDelete: "cascade" }),
    day: d.date().notNull(),
    count: d.bigint({ mode: "number" }).notNull().default(0),
  }),
  (table) => [
    primaryKey({ columns: [table.tokenId, table.day] }),
    index().on(table.day),
  ],
);
