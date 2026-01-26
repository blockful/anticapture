import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: Pool | null = null;

/**
 * Initialize the database connection
 * @param connectionString - PostgreSQL connection URL
 */
export function initDb(connectionString: string) {
  if (db) {
    return db;
  }

  pool = new Pool({
    connectionString,
  });

  db = drizzle(pool, { schema });
  return db;
}

/**
 * Get the database instance
 * @throws Error if database is not initialized
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export { schema };
