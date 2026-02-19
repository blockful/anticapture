import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/env";
import * as schema from "@/repository/schema";
import { DrizzleRepository } from "@/repository/db";
import { SnapshotProvider } from "@/provider/dataProvider";
import { Indexer } from "@/indexer";

async function main() {
  console.log(`Starting offchain indexer for DAO: ${env.PROVIDER_DAO_ID}`);

  const db = drizzle(env.DATABASE_URL, { schema });

  const repository = await DrizzleRepository.create(db);
  const provider = new SnapshotProvider(
    env.PROVIDER_ENDPOINT,
    env.PROVIDER_DAO_ID,
    env.PROVIDER_API_KEY,
  );
  const indexer = new Indexer(repository, provider, env.POLLING_INTERVAL_MS);

  await indexer.start(env.FORCE_BACKFILL);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
