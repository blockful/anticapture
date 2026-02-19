import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { execSync } from "child_process";
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
 * Push schema to the database (like drizzle-kit push)
 */
export function runMigrations(connectionString: string) {
  initDb(connectionString);
  execSync("drizzle-kit push --force", {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });
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
