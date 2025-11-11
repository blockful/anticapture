import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as offchainSchema from "@/offchain/offchain.schema";
import { env } from "@/env";

/**
 * Writable database connection for offchain data.
 * Separate from Ponder's managed connection.
 *
 * Used for:
 * - External API data (DeFi Llama treasury)
 * - Manual data operations outside indexing
 * - Background jobs and cron tasks
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Set search_path to match Ponder's schema
pool.on("connect", (client) => {
  // Priority: DATABASE_SCHEMA env var > RAILWAY_DEPLOYMENT_ID > 'public'
  const schema =
    process.env.DATABASE_SCHEMA ||
    process.env.RAILWAY_DEPLOYMENT_ID ||
    "public";
  client.query(`SET search_path TO "${schema}"`, (err) => {
    if (err) {
      console.error(`Failed to set search_path to ${schema}:`, err);
    } else {
      console.log(`[DB] Set search_path to "${schema}"`);
    }
  });
});

export const writableDb = drizzle(pool, {
  schema: offchainSchema,
});
