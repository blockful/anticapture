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
import { formatUnits } from "viem";

import { initDb, getDb, schema } from "@/db";
import { ArkhamClient } from "@/clients/arkham";
import { AnticaptureClient } from "@/clients/anticapture";
import { isContract, createRpcClient } from "@/utils/address-type";
import dotenv from "dotenv";
import { DaoIdEnum } from "@/utils/types";

dotenv.config();

interface AddressInfo {
  address: string;
  isDelegate: boolean;
  isHolder: boolean;
  votingPower?: string;
  balance?: string;
  delegationsCount?: number;
}

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

interface EnrichResult {
  address: string;
  isNew: boolean;
  entity: string | null;
  entityType: string | null;
  label: string | null;
  twitter: string | null;
  isContract: boolean;
}

async function enrichAddress(
  address: string,
  arkhamClient: ArkhamClient,
  rpcClient: ReturnType<typeof createRpcClient>,
  db: ReturnType<typeof getDb>,
): Promise<EnrichResult> {
  const normalizedAddress = address.toLowerCase();

  // Check if already exists
  const existing = await db.query.addressEnrichment.findFirst({
    where: eq(schema.addressEnrichment.address, normalizedAddress),
  });

  if (existing) {
    return {
      address: normalizedAddress,
      isNew: false,
      entity: existing.arkhamEntity,
      entityType: existing.arkhamEntityType,
      label: existing.arkhamLabel,
      twitter: existing.arkhamTwitter,
      isContract: existing.isContract,
    };
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
      arkhamTwitter: arkhamData?.twitter ?? null,
    })
    .onConflictDoNothing();

  return {
    address: normalizedAddress,
    isNew: true,
    entity: arkhamData?.entity ?? null,
    entityType: arkhamData?.entityType ?? null,
    label: arkhamData?.label ?? null,
    twitter: arkhamData?.twitter ?? null,
    isContract: isContractAddress,
  };
}

/**
 * Process addresses as they stream in, enriching immediately
 */
const processAndEnrichDelegates = async (
  anticaptureClient: AnticaptureClient,
  arkhamClient: ArkhamClient,
  rpcClient: ReturnType<typeof createRpcClient>,
  db: ReturnType<typeof getDb>,
  daoId: string,
): Promise<{ newCount: number; existingCount: number; errorCount: number }> => {
  console.log(`\n📊 Fetching and enriching delegates for ${daoId}...`);

  let newCount = 0;
  let existingCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  try {
    for await (const d of anticaptureClient.streamTopDelegates(daoId)) {
      processedCount++;
      const addr = d.accountId.toLowerCase();
      const progress = `[${daoId} delegate ${processedCount}]`;
      const roleStr = `(delegate)`;

      try {
        const result = await enrichAddress(addr, arkhamClient, rpcClient, db);

        const arkhamParts: string[] = [];
        if (result.entity) arkhamParts.push(result.entity);
        if (result.label) arkhamParts.push(`"${result.label}"`);
        if (result.entityType) arkhamParts.push(`[${result.entityType}]`);
        if (result.twitter) arkhamParts.push(`@${result.twitter}`);
        if (result.isContract) arkhamParts.push("📜 contract");
        const arkhamStr =
          arkhamParts.length > 0 ? `→ ${arkhamParts.join(" ")}` : "→ unknown";

        if (result.isNew) {
          newCount++;
          console.log(`   ${progress} ✅ ${addr} ${roleStr} ${arkhamStr}`);
        } else {
          existingCount++;
          console.log(`   ${progress} ⏭️  ${addr} ${roleStr} ${arkhamStr}`);
        }
      } catch (error) {
        errorCount++;
        console.error(
          `   ${progress} ❌ ${addr} ${roleStr}:`,
          error instanceof Error ? error.message : error,
        );
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error(`   ❌ Failed to fetch delegates for ${daoId}:`, error);
  }

  console.log(`   Processed ${processedCount} delegates`);
  return { newCount, existingCount, errorCount };
};

const processAndEnrichHolders = async (
  anticaptureClient: AnticaptureClient,
  arkhamClient: ArkhamClient,
  rpcClient: ReturnType<typeof createRpcClient>,
  db: ReturnType<typeof getDb>,
  daoId: string,
): Promise<{ newCount: number; existingCount: number; errorCount: number }> => {
  console.log(`\n💰 Fetching and enriching token holders for ${daoId}...`);

  let newCount = 0;
  let existingCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  try {
    for await (const h of anticaptureClient.streamTopTokenHolders(daoId)) {
      processedCount++;
      const addr = h.address.toLowerCase();
      const progress = `[${daoId} holder ${processedCount}]`;
      const roleStr = `(holder)`;

      try {
        const result = await enrichAddress(addr, arkhamClient, rpcClient, db);

        const arkhamParts: string[] = [];
        if (result.entity) arkhamParts.push(result.entity);
        if (result.label) arkhamParts.push(`"${result.label}"`);
        if (result.entityType) arkhamParts.push(`[${result.entityType}]`);
        if (result.twitter) arkhamParts.push(`@${result.twitter}`);
        if (result.isContract) arkhamParts.push("📜 contract");
        const arkhamStr =
          arkhamParts.length > 0 ? `→ ${arkhamParts.join(" ")}` : "→ unknown";

        if (result.isNew) {
          newCount++;
          console.log(`   ${progress} ✅ ${addr} ${roleStr} ${arkhamStr}`);
        } else {
          existingCount++;
          console.log(`   ${progress} ⏭️  ${addr} ${roleStr} ${arkhamStr}`);
        }
      } catch (error) {
        errorCount++;
        console.error(
          `   ${progress} ❌ ${addr} ${roleStr}:`,
          error instanceof Error ? error.message : error,
        );
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error(`   ❌ Failed to fetch holders for ${daoId}:`, error);
  }

  console.log(`   Processed ${processedCount} holders`);
  return { newCount, existingCount, errorCount };
};

async function main() {
  const options = parseArgs();

  console.log("🚀 Starting address sync...");

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

  let totalNew = 0;
  let totalExisting = 0;
  let totalErrors = 0;

  for (const daoId of Object.values(DaoIdEnum)) {
    if (!options.holdersOnly) {
      const results = await processAndEnrichDelegates(
        anticaptureClient,
        arkhamClient,
        rpcClient,
        db,
        daoId,
      );
      totalNew += results.newCount;
      totalExisting += results.existingCount;
      totalErrors += results.errorCount;
    }

    if (!options.delegatesOnly) {
      const results = await processAndEnrichHolders(
        anticaptureClient,
        arkhamClient,
        rpcClient,
        db,
        daoId,
      );
      totalNew += results.newCount;
      totalExisting += results.existingCount;
      totalErrors += results.errorCount;
    }
  }

  console.log(`\n✨ Sync complete!`);
  console.log(`   New addresses: ${totalNew}`);
  console.log(`   Already existed: ${totalExisting}`);
  console.log(`   Errors: ${totalErrors}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
