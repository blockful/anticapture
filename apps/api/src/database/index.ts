import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

import type * as generalSchema from "./general-schema";
import type * as offchainSchema from "./offchain-schema";
import type * as schema from "./schema";

export type Drizzle =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

export type ReadonlyDrizzle = Omit<
  Drizzle,
  | "insert"
  | "update"
  | "delete"
  | "transaction"
  | "refreshMaterializedView"
  | "_"
>;

export type OffchainDrizzle =
  | NodePgDatabase<typeof offchainSchema>
  | PgliteDatabase<typeof offchainSchema>;

export type UnifiedDrizzle =
  | NodePgDatabase<typeof schema & typeof offchainSchema & typeof generalSchema>
  | PgliteDatabase<
      typeof schema & typeof offchainSchema & typeof generalSchema
    >;

export * from "./schema";
export * from "./offchain-schema";
export * from "./general-schema";
