import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { historicalTreasury } from "ponder:schema";
import { env } from "@/env";

/**
 * Writable database connection for tables that need write access from API.
 *
 * The Ponder db is read-only to protect data integrity during indexing.
 * This connection allows writing to specific tables (like historical_treasury)
 * that are populated from external APIs via cron jobs.
 *
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Set search_path to match Ponder's schema on every connection
pool.on("connect", (client) => {
  const schema =
    process.env.DATABASE_SCHEMA ||
    process.env.RAILWAY_DEPLOYMENT_ID ||
    "public";

  client.query(`SET search_path TO "${schema}"`, (err) => {
    if (err) {
      console.error(`[DB] Failed to set search_path to ${schema}:`, err);
    } else {
      console.log(`[DB] Writable connection set to schema "${schema}"`);
    }
  });
});

// Export writable db with only the tables that need write access
export const writableDb = drizzle(pool, {
  schema: { historicalTreasury },
});
