import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { historicalTreasury } from "ponder:schema";
import { TreasuryProvider } from "./providers";
import { TreasuryDataPoint } from "./types";
import { sql, gte, desc, asc } from "drizzle-orm";

export class TreasuryService {
  constructor(
    private readonly db: NodePgDatabase<{
      historicalTreasury: typeof historicalTreasury;
    }>,
    private readonly provider: TreasuryProvider,
  ) {}

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
    const existingRecords = await this.db
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
    await this.db
      .insert(historicalTreasury)
      .values(
        toUpsert.map((item) => ({
          date: item.date,
          totalTreasury: item.totalTreasury,
          treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
          updatedAt: Date.now().toString(),
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

    return {
      synced: toUpsert.length,
      unchanged: unchangedCount,
    };
  }

  /**
   * Gets historical treasury data from database.
   * @param params - Query parameters
   * @param params.days - Number of days to fetch (optional, defaults to all)
   * @param params.order - Sort order
   */
  async getHistoricalTreasury(params: {
    days?: number;
    order?: "asc" | "desc";
  }): Promise<TreasuryDataPoint[]> {
    const { days, order = "asc" } = params;

    // Build base query
    let query = this.db
      .select({
        date: historicalTreasury.date,
        totalTreasury: historicalTreasury.totalTreasury,
        treasuryWithoutDaoToken: historicalTreasury.treasuryWithoutDaoToken,
      })
      .from(historicalTreasury)
      .$dynamic();

    // Filter by days if specified
    if (days) {
      const cutoffTimestamp = BigInt(
        Math.floor(Date.now() / 1000) - days * 24 * 60 * 60,
      );
      query = query.where(gte(historicalTreasury.date, cutoffTimestamp));
    }

    // Apply ordering
    query =
      order === "asc"
        ? query.orderBy(asc(historicalTreasury.date))
        : query.orderBy(desc(historicalTreasury.date));

    return await query;
  }
}
