import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { env } from "@/env";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type UserApiDrizzle = NodePgDatabase<typeof schema>;

export * from "./schema";
