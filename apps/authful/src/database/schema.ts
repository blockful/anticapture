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

export const usageHourly = authfulSchema.table(
  "usage_hourly",
  (d) => ({
    tokenId: d
      .uuid("token_id")
      .notNull()
      .references(() => tokens.id),
    route: d.text().notNull(), // normalized route pattern, e.g. /{dao}/proposals
    hour: d.timestamp({ withTimezone: true }).notNull(), // truncated to the hour
    // No default: count always comes from the batch payload, and a bigint
    // default breaks drizzle-kit's snapshot serialization (JSON + BigInt).
    count: d.bigint({ mode: "bigint" }).notNull(),
  }),
  (table) => [
    primaryKey({ columns: [table.tokenId, table.route, table.hour] }),
  ],
);
