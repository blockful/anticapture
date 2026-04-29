import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/database/schema";
import { logger } from "@/logger";

export function isRailwayPreviewEnv(): boolean {
  // HACK: This will remain coupled to the raiwlay environment for now as we have no way to avoid it
  return !["dev", "production"].includes(
    process.env.RAILWAY_ENVIRONMENT_NAME || "dev",
  );
}

export async function runCiSeed(_pgClient: NodePgDatabase<typeof schema>) {
  logger.info("TODO");
}
