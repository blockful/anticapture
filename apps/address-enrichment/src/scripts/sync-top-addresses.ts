/**
 * CLI script to sync top addresses from Anticapture API
 *
 * Usage:
 *   pnpm address-enrichment sync --limit 100
 *   pnpm address-enrichment sync --limit 50 --delegates-only
 *   pnpm address-enrichment sync --limit 50 --holders-only
 */

import { eq } from "drizzle-orm";
import type { Address } from "viem";

import { initDb, getDb, schema } from "@/db";
import { ArkhamClient } from "@/clients/arkham";
import { AnticaptureClient } from "@/clients/anticapture";
import { isContract, createRpcClient } from "@/utils/address-type";

// Parse environment variables (simplified for CLI)
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

interface SyncOptions {
  limit: number;
  delegatesOnly: boolean;
  holdersOnly: boolean;
}

function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    limit: 100,
    delegatesOnly: false,
    holdersOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[i + 1]!, 10);
      i++;
    } else if (arg === "--delegates-only") {
      options.delegatesOnly = true;
    } else if (arg === "--holders-only") {
      options.holdersOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: pnpm address-enrichment sync [options]

Options:
  --limit <n>       Number of addresses to fetch per category (default: 100)
  --delegates-only  Only sync top delegates
  --holders-only    Only sync top token holders
  --help, -h        Show this help message

Examples:
  pnpm address-enrichment sync --limit 100
  pnpm address-enrichment sync --limit 50 --delegates-only
`);
      process.exit(0);
    }
  }

  return options;
}

async function enrichAddress(
  address: string,
  arkhamClient: ArkhamClient,
  rpcClient: ReturnType<typeof createRpcClient>,
  db: ReturnType<typeof getDb>,
): Promise<{ address: string; isNew: boolean }> {
  const normalizedAddress = address.toLowerCase();

  // Check if already exists
  const existing = await db.query.addressEnrichment.findFirst({
    where: eq(schema.addressEnrichment.address, normalizedAddress),
  });

  if (existing) {
    return { address: normalizedAddress, isNew: false };
  }

  // Fetch from Arkham first
  const arkhamData =
    await arkhamClient.getAddressIntelligence(normalizedAddress);

  // Use Arkham's contract info if available, otherwise fall back to RPC
  let isContractAddress: boolean;
  if (arkhamData?.isContract !== null && arkhamData?.isContract !== undefined) {
    isContractAddress = arkhamData.isContract;
  } else {
    isContractAddress = await isContract(
      rpcClient,
      normalizedAddress as Address,
    );
  }

  // Store in database
  await db
    .insert(schema.addressEnrichment)
    .values({
      address: normalizedAddress,
      isContract: isContractAddress,
      arkhamEntity: arkhamData?.entity ?? null,
      arkhamEntityType: arkhamData?.entityType ?? null,
      arkhamLabel: arkhamData?.label ?? null,
    })
    .onConflictDoNothing();

  return { address: normalizedAddress, isNew: true };
}

async function main() {
  const options = parseArgs();

  console.log("🚀 Starting address sync...");
  console.log(`   Limit: ${options.limit} per category`);

  // Initialize connections
  const databaseUrl = getEnv("DATABASE_URL");
  const arkhamApiKey = getEnv("ARKHAM_API_KEY");
  const arkhamApiUrl = getEnv(
    "ARKHAM_API_URL",
    "https://api.arkhamintelligence.com",
  );
  const rpcUrl = getEnv("RPC_URL");
  const anticaptureApiUrl = getEnv("ANTICAPTURE_API_URL");

  initDb(databaseUrl);
  const db = getDb();

  const arkhamClient = new ArkhamClient(arkhamApiUrl, arkhamApiKey);
  const anticaptureClient = new AnticaptureClient(anticaptureApiUrl);
  const rpcClient = createRpcClient(rpcUrl);

  // Collect addresses to sync
  const addressesToSync = new Set<string>();

  if (!options.holdersOnly) {
    console.log(`\n📊 Fetching top ${options.limit} delegates...`);
    try {
      const delegates = await anticaptureClient.getTopDelegates(options.limit);
      delegates.forEach((addr) => addressesToSync.add(addr.toLowerCase()));
      console.log(`   Found ${delegates.length} delegates`);
    } catch (error) {
      console.error("   ❌ Failed to fetch delegates:", error);
    }
  }

  if (!options.delegatesOnly) {
    console.log(`\n💰 Fetching top ${options.limit} token holders...`);
    try {
      const holders = await anticaptureClient.getTopTokenHolders(options.limit);
      holders.forEach((addr) => addressesToSync.add(addr.toLowerCase()));
      console.log(`   Found ${holders.length} token holders`);
    } catch (error) {
      console.error("   ❌ Failed to fetch token holders:", error);
    }
  }

  const uniqueAddresses = Array.from(addressesToSync);
  console.log(`\n🔄 Syncing ${uniqueAddresses.length} unique addresses...`);

  let newCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  for (let i = 0; i < uniqueAddresses.length; i++) {
    const address = uniqueAddresses[i]!;
    const progress = `[${i + 1}/${uniqueAddresses.length}]`;

    try {
      const result = await enrichAddress(address, arkhamClient, rpcClient, db);

      if (result.isNew) {
        newCount++;
        console.log(`   ${progress} ✅ ${address} (new)`);
      } else {
        existingCount++;
        console.log(`   ${progress} ⏭️  ${address} (exists)`);
      }
    } catch (error) {
      errorCount++;
      console.error(
        `   ${progress} ❌ ${address}:`,
        error instanceof Error ? error.message : error,
      );
    }

    // Small delay to avoid rate limiting
    if (i < uniqueAddresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✨ Sync complete!`);
  console.log(`   New addresses: ${newCount}`);
  console.log(`   Already existed: ${existingCount}`);
  console.log(`   Errors: ${errorCount}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
