import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: Pool | null = null;

function findDrizzleKitBin() {
  const candidates = [
    process.cwd(),
    dirname(fileURLToPath(import.meta.url)),
    dirname(dirname(fileURLToPath(import.meta.url))),
  ];

  for (const baseDir of candidates) {
    let currentDir = baseDir;

    while (currentDir !== dirname(currentDir)) {
      const binPath = join(currentDir, "node_modules", ".bin", "drizzle-kit");

      if (existsSync(binPath)) {
        return { appRoot: currentDir, binPath };
      }

      currentDir = dirname(currentDir);
    }
  }

  throw new Error("Could not find local drizzle-kit binary");
}

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
  const { appRoot, binPath } = findDrizzleKitBin();
  const result = spawnSync(binPath, ["push"], {
    cwd: appRoot,
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: connectionString },
  });

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);

  if (result.error) {
    throw result.error;
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0 || /^Error:/m.test(output)) {
    throw new Error("drizzle-kit push failed");
  }
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
