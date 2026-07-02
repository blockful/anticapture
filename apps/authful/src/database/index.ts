import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

import type * as schema from "./schema";

export type AuthfulDrizzle =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

export * from "./schema";
