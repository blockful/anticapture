import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { type Address } from "viem";

import { initDb, getDb, addressEnrichment } from "@/db";
import { isContract, createRpcClient } from "@/utils/address-type";

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const PAGE_SIZE = 100;

async function main() {
  const databaseUrl = getEnv("DATABASE_URL");
  const rpcUrl = getEnv("RPC_URL");

  initDb(databaseUrl);
  const db = getDb();

  const rpcClient = createRpcClient(rpcUrl);

  console.log("🔍 Scanning for EOA records to re-verify...");

  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  while (true) {
    const records = await db.query.addressEnrichment.findMany({
      where: eq(addressEnrichment.isContract, false),
      limit: PAGE_SIZE,
      offset,
    });

    if (records.length === 0) break;

    for (const record of records) {
      try {
        const contractStatus = await isContract(
          rpcClient,
          record.address as Address,
        );

        await db
          .update(addressEnrichment)
          .set({ isContract: contractStatus })
          .where(eq(addressEnrichment.address, record.address));

        totalUpdated++;
        console.log(`   ✅ ${record.address}: false → ${contractStatus}`);

        totalProcessed++;
      } catch (error) {
        totalErrors++;
        console.error(
          `   ❌ ${record.address}:`,
          error instanceof Error ? error.message : error,
        );
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    offset += PAGE_SIZE;
  }

  console.log(`\n✨ Done!`);
  console.log(`   Processed: ${totalProcessed}`);
  console.log(`   Updated:   ${totalUpdated}`);
  console.log(`   Errors:    ${totalErrors}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
