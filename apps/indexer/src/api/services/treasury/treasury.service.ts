import { writableDb } from "@/lib/db";
import { historicalTreasury } from "ponder:schema";
import { TreasuryProvider } from "./providers";
import { TreasuryDataPoint } from "./types";
import { eq } from "drizzle-orm";

export class TreasuryService {
  constructor(
    private readonly provider: TreasuryProvider,
    private readonly daoId: string,
  ) {}

  /**
   * Syncs treasury data from provider to database.
   * Inserts missing dates and updates existing values that changed.
   * Uses early stop optimization: stops checking older dates when values match.
   */
  async syncTreasury(): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    stoppedEarly: boolean;
  }> {
    console.log(`[TreasuryService] Starting sync for DAO: ${this.daoId}`);

    // 1. Fetch all historical data from provider
    const providerData = await this.provider.fetchTreasury(this.daoId);
    console.log(
      `[TreasuryService] Fetched ${providerData.length} data points from provider`,
    );

    // 2. Get existing records from database (all fields for comparison)
    const existingRecords = await writableDb
      .select({
        date: historicalTreasury.date,
        totalTreasury: historicalTreasury.totalTreasury,
        treasuryWithoutDaoToken: historicalTreasury.treasuryWithoutDaoToken,
      })
      .from(historicalTreasury);

    const existingDataMap = new Map(existingRecords.map((r) => [r.date, r]));
    console.log(
      `[TreasuryService] Found ${existingDataMap.size} existing records in database`,
    );

    // 3. Process data in reverse chronological order (newest first)
    const sortedProviderData = [...providerData].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    const toInsert: typeof providerData = [];
    const toUpdate: typeof providerData = [];
    let unchangedCount = 0;
    let stoppedEarly = false;

    for (const item of sortedProviderData) {
      const existing = existingDataMap.get(item.date);

      if (!existing) {
        // New date - needs to be inserted
        toInsert.push(item);
      } else {
        // Existing date - check if values changed
        const valuesChanged =
          existing.totalTreasury !== item.totalTreasury ||
          existing.treasuryWithoutDaoToken !== item.treasuryWithoutDaoToken;

        if (valuesChanged) {
          toUpdate.push(item);
        } else {
          // Values unchanged - early stop optimization
          unchangedCount++;
          console.log(
            `[TreasuryService] Found unchanged value at ${item.date}, stopping early (${sortedProviderData.indexOf(item) + 1}/${sortedProviderData.length} processed)`,
          );
          stoppedEarly = true;
          break;
        }
      }
    }

    // Count remaining items as unchanged if we stopped early
    if (stoppedEarly) {
      const processed = toInsert.length + toUpdate.length + unchangedCount;
      unchangedCount += sortedProviderData.length - processed;
    }

    console.log(
      `[TreasuryService] Sync plan: ${toInsert.length} insert, ${toUpdate.length} update, ${unchangedCount} unchanged`,
    );

    // 4. Insert new records
    if (toInsert.length > 0) {
      await writableDb.insert(historicalTreasury).values(
        toInsert.map((item) => ({
          date: item.date,
          totalTreasury: item.totalTreasury,
          treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
          updatedAt: BigInt(Date.now()),
        })),
      );
      console.log(`[TreasuryService] Inserted ${toInsert.length} new records`);
    }

    // 5. Update changed records
    if (toUpdate.length > 0) {
      const now = BigInt(Date.now());
      for (const item of toUpdate) {
        await writableDb
          .update(historicalTreasury)
          .set({
            totalTreasury: item.totalTreasury,
            treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
            updatedAt: now,
          })
          .where(eq(historicalTreasury.date, item.date));
      }
      console.log(`[TreasuryService] Updated ${toUpdate.length} records`);
    }

    return {
      inserted: toInsert.length,
      updated: toUpdate.length,
      unchanged: unchangedCount,
      stoppedEarly,
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
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split("T")[0]!; // ISO format always has 'T'

      return results.filter((r) => r.date >= cutoffStr);
    }

    return results;
  }

  /**
   * Clears all historical treasury data (use with caution).
   */
  async clearHistoricalData(): Promise<void> {
    await writableDb.delete(historicalTreasury);
    console.log(`[TreasuryService] Cleared all historical treasury data`);
  }
}
