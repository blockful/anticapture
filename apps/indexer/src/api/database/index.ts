import type * as schema from "ponder:schema";
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

/**
 * Database-agnostic type supporting both read-write and read-only contexts
 * Use this type in repositories that work with both Ponder's API context
 * and indexing context
 */
export type DrizzleDB = Drizzle | ReadonlyDrizzle;
