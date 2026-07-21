import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

import type * as schema from "./schema";

// Union with PGlite so integration tests can run the whole app in-memory,
// mirroring the authful service's pattern. Kept free of the runtime client
// (and its env validation) so tests can import types without a DATABASE_URL.
export type UserApiDrizzle =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;
