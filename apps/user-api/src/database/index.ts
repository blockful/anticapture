import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/env";
import * as schema from "./schema";

// Timeouts so a wedged Postgres can't hang connections (or requests) forever.
export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
  },
  schema,
});

export * from "./schema";
export * from "./types";
