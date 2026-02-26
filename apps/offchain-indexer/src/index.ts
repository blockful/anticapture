import axios from "axios";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { env } from "@/env";
import * as schema from "@/repository/schema";
import { DrizzleRepository } from "@/repository/db";
import { SnapshotProvider } from "@/provider/dataProvider";
import { Indexer } from "@/indexer";

async function main() {
  console.log(`Starting offchain indexer for DAO: ${env.PROVIDER_DAO_ID}`);

  const db = drizzle(env.DATABASE_URL, { schema });

  await migrate(db, {
    migrationsFolder: "./drizzle",
    migrationsSchema: "snapshot",
  });

  const repository = new DrizzleRepository(db);
  const provider = new SnapshotProvider(
    axios.create({
      baseURL: env.PROVIDER_ENDPOINT,
      headers: env.PROVIDER_API_KEY ? { "x-api-key": env.PROVIDER_API_KEY } : {},
    }),
    env.PROVIDER_DAO_ID,
  );
  const indexer = new Indexer(repository, provider, env.POLLING_INTERVAL_MS);

  await indexer.start(env.FORCE_BACKFILL);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
