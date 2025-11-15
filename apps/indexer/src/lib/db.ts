import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { historicalTreasury } from "ponder:schema";
import { env } from "@/env";

/**
 * Writable database connection for external API data.
 * Ponder's db is read-only, so we need a separate connection for tables
 * populated by cron jobs (e.g., historical_treasury from DeFi data provider).
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("connect", (client) => {
  const schema =
    process.env.DATABASE_SCHEMA ||
    process.env.RAILWAY_DEPLOYMENT_ID ||
    "public";

  void client.query(`SET search_path TO "${schema}"`);
});

export const writableDb = drizzle(pool, {
  schema: { historicalTreasury },
});
