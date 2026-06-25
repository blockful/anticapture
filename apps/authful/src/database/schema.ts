import { index, pgSchema } from "drizzle-orm/pg-core";

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
