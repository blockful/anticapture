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

interface AddressInfo {
  address: string;
  isDelegate: boolean;
  isHolder: boolean;
  votingPower?: string;
  balance?: string;
  delegationsCount?: number;
}

/**
 * Format large numbers with K, M, B suffixes
 */
function formatLargeNumber(value: string, decimals: number = 18): string {
  const num = Number(formatUnits(BigInt(value), decimals));
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
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

  // Collect addresses with their info
  const addressMap = new Map<string, AddressInfo>();

  if (!options.holdersOnly) {
    console.log(`\n📊 Fetching top ${options.limit} delegates...`);
    try {
      const delegates = await anticaptureClient.getTopDelegates(options.limit);
      delegates.forEach((d) => {
        const addr = d.accountId.toLowerCase();
        const existing = addressMap.get(addr);
        addressMap.set(addr, {
          address: addr,
          isDelegate: true,
          isHolder: existing?.isHolder ?? false,
          votingPower: d.votingPower,
          delegationsCount: d.delegationsCount,
          balance: existing?.balance,
        });
      });
      console.log(`   Found ${delegates.length} delegates`);
    } catch (error) {
      console.error("   ❌ Failed to fetch delegates:", error);
    }
  }

  if (!options.delegatesOnly) {
    console.log(`\n💰 Fetching top ${options.limit} token holders...`);
    try {
      const holders = await anticaptureClient.getTopTokenHolders(options.limit);
      holders.forEach((h) => {
        const addr = h.accountId.toLowerCase();
        const existing = addressMap.get(addr);
        addressMap.set(addr, {
          address: addr,
          isDelegate: existing?.isDelegate ?? false,
          isHolder: true,
          votingPower: existing?.votingPower,
          delegationsCount: existing?.delegationsCount,
          balance: h.balance,
        });
      });
      console.log(`   Found ${holders.length} token holders`);
    } catch (error) {
      console.error("   ❌ Failed to fetch token holders:", error);
    }
  }

  const addressList = Array.from(addressMap.values());
  console.log(`\n🔄 Syncing ${addressList.length} unique addresses...`);

  let newCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  for (let i = 0; i < addressList.length; i++) {
    const info = addressList[i]!;
    const progress = `[${i + 1}/${addressList.length}]`;

    // Build role description
    const roles: string[] = [];
    if (info.isDelegate && info.votingPower) {
      const vpFormatted = formatLargeNumber(info.votingPower, 18);
      roles.push(`delegate: ${vpFormatted} VP`);
    }
    if (info.isHolder && info.balance) {
      const balFormatted = formatLargeNumber(info.balance, 18);
      roles.push(`holder: ${balFormatted}`);
    }
    const roleStr = roles.length > 0 ? `(${roles.join(", ")})` : "";

    try {
      const result = await enrichAddress(
        info.address,
        arkhamClient,
        rpcClient,
        db,
      );

      // Build Arkham info string
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
        console.log(
          `   ${progress} ✅ ${info.address} ${roleStr} ${arkhamStr}`,
        );
      } else {
        existingCount++;
        console.log(
          `   ${progress} ⏭️  ${info.address} ${roleStr} ${arkhamStr}`,
        );
      }
    } catch (error) {
      errorCount++;
      console.error(
        `   ${progress} ❌ ${info.address} ${roleStr}:`,
        error instanceof Error ? error.message : error,
      );
    }

    // Small delay to avoid rate limiting
    if (i < addressList.length - 1) {
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
