import { writableDb } from "@/lib/db";
import { historicalTreasury } from "ponder:schema";
import { TreasuryProvider } from "./providers";
import { TreasuryDataPoint } from "./types";
import { sql } from "drizzle-orm";

export class TreasuryService {
  constructor(private readonly provider: TreasuryProvider) {}

  /**
   * Syncs treasury data from provider to database.
   * Uses upsert to insert new dates or update changed values.
   */
  async syncTreasury(): Promise<{
    synced: number;
    unchanged: number;
  }> {
    // Fetch all historical data from provider
    const providerData = await this.provider.fetchTreasury();

    // Get existing records from database
    const existingRecords = await writableDb
      .select({
        date: historicalTreasury.date,
        totalTreasury: historicalTreasury.totalTreasury,
        treasuryWithoutDaoToken: historicalTreasury.treasuryWithoutDaoToken,
      })
      .from(historicalTreasury);
    const existingDataMap = new Map(existingRecords.map((r) => [r.date, r]));

    // Process data in reverse chronological order (newest first)
    const sortedProviderData = [...providerData].sort((a, b) =>
      Number(b.date - a.date),
    );

    const toUpsert: typeof providerData = [];
    let unchangedCount = 0;

    for (const item of sortedProviderData) {
      const existing = existingDataMap.get(item.date);

      if (!existing) {
        // New date - will be upserted
        toUpsert.push(item);
      } else {
        // Existing date - check if values changed
        const valuesChanged =
          existing.totalTreasury !== item.totalTreasury ||
          existing.treasuryWithoutDaoToken !== item.treasuryWithoutDaoToken;

        if (valuesChanged) {
          // Values changed - will be upserted
          toUpsert.push(item);
        } else {
          // Values unchanged - stop checking older records
          unchangedCount++;
          break;
        }
      }
    }

    // Batch upsert all records that need processing
    if (toUpsert.length > 0) {
      await writableDb
        .insert(historicalTreasury)
        .values(
          toUpsert.map((item) => ({
            date: item.date,
            totalTreasury: item.totalTreasury,
            treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
            updatedAt: BigInt(Date.now()),
          })),
        )
        .onConflictDoUpdate({
          target: historicalTreasury.date,
          set: {
            totalTreasury: sql`excluded.total_treasury`,
            treasuryWithoutDaoToken: sql`excluded.treasury_without_dao_token`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }

    return {
      synced: toUpsert.length,
      unchanged: unchangedCount,
    };
  }

  /**
   * Gets historical treasury data from database.
   * @param days - Number of days to fetch (optional, defaults to all)
   */
  async getHistoricalTreasury(days?: number): Promise<TreasuryDataPoint[]> {
    const query = writableDb
      .select({
        date: historicalTreasury.date,
        totalTreasury: historicalTreasury.totalTreasury,
        treasuryWithoutDaoToken: historicalTreasury.treasuryWithoutDaoToken,
      })
      .from(historicalTreasury)
      .orderBy(historicalTreasury.date);

    const results = await query;

    // Filter by days if specified
    if (days) {
      const cutoffTimestamp = BigInt(
        Math.floor(Date.now() / 1000) - days * 24 * 60 * 60,
      );
      return results.filter((r) => r.date >= cutoffTimestamp);
    }

    return results;
  }
}
