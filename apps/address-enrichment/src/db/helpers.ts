import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
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

  // Fail fast when Postgres is unreachable instead of hanging pg-pool connects
  // forever. No statement_timeout: this pool also runs migrations.
  pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
  });

  db = drizzle(pool, { schema });
  return db;
}

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
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
