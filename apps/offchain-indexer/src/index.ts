import axios from "axios";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { env } from "@/env";
import { Indexer } from "@/indexer";
import { logger } from "@/logger";
import { SnapshotProvider } from "@/provider/dataProvider";
import { DrizzleRepository } from "@/repository/db";
import * as schema from "@/repository/schema";

async function main() {
  logger.info({ dao: env.PROVIDER_DAO_ID }, "starting offchain indexer");

  const db = drizzle(env.DATABASE_URL, { schema });

  await migrate(db, {
    migrationsFolder: "./drizzle",
    migrationsSchema: "snapshot",
  });

  const repository = new DrizzleRepository(db);
  const provider = new SnapshotProvider(
    axios.create({
      baseURL: env.PROVIDER_ENDPOINT,
      headers: env.PROVIDER_API_KEY
        ? { "x-api-key": env.PROVIDER_API_KEY }
        : {},
    }),
    env.PROVIDER_DAO_ID,
  );
  const indexer = new Indexer(repository, provider, env.POLLING_INTERVAL_MS);

  await indexer.start(env.FORCE_BACKFILL);
}

main().catch((err) => {
  logger.error({ err }, "fatal error");
  process.exit(1);
});
