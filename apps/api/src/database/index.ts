import type * as schema from "./schema";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

/**
 * Full Drizzle database type with write capabilities
 * This follows Ponder's Drizzle type definition pattern from:
 * node_modules/ponder/src/types/db.ts
 *
 * Supports:
 * - NodePgDatabase: PostgreSQL via node-postgres driver
 * - PgliteDatabase: PGlite embedded PostgreSQL
 */
export type Drizzle =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;
/**
 * Read-only Drizzle database type (used in Ponder API context)
 * Omits write operations: insert, update, delete, transaction
 */
export type ReadonlyDrizzle = Omit<
  Drizzle,
  | "insert"
  | "update"
  | "delete"
  | "transaction"
  | "refreshMaterializedView"
  | "_"
>;

export * from "./schema";
