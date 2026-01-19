import { AxiosInstance } from "axios";
import { TreasuryProvider } from "./treasury-provider.interface";
import { LiquidTreasuryDataPoint } from "../types";
import { truncateTimestampToMidnight } from "@/lib/date-helpers";
import { filterWithFallback } from "@/lib/query-helpers";
import { TreasuryProviderCache } from "./provider-cache";

interface RawDefiLlamaResponse {
  chainTvls: Record<
    string,
    {
      tvl: Array<{
        date: number; // Unix timestamp in seconds
        totalLiquidityUSD: number;
      }>;
      tokensInUsd?: Array<unknown>;
      tokens?: Array<unknown>;
    }
  >;
}

export class DefiLlamaProvider implements TreasuryProvider {
  private readonly cache = new TreasuryProviderCache();
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    const cached = this.cache.get();

    if (cached !== null) return filterWithFallback(cached, cutoffTimestamp);

    try {
      const response = await this.client.get<RawDefiLlamaResponse>(``);
      const data = this.transformData(response.data);
      this.cache.set(data);

      return filterWithFallback(data, cutoffTimestamp);
    } catch (error) {
      console.error(
        `[DefiLlamaProvider] Failed to fetch treasury data:`,
        error,
      );
      return [];
    }
  }

  /**
   * Transforms DeFi Llama's raw response into our standardized format.
   */
  private transformData(
    rawData: RawDefiLlamaResponse,
  ): LiquidTreasuryDataPoint[] {
    const { chainTvls } = rawData;

    // Map: chainKey → Map(dayTimestamp → latest dataPoint)
    const chainsByDate = new Map<
      string,
      Map<number, { timestamp: number; value: number }>
    >();

    // For each chain, keep only the latest timestamp per date
    for (const [chainKey, chainData] of Object.entries(chainTvls)) {
      // Only process base chains and global OwnTokens
      if (chainKey.includes("-")) {
        continue; // Skip {Chain}-OwnTokens variants
      }

      const dateMap = new Map<number, { timestamp: number; value: number }>();

      for (const dataPoint of chainData.tvl || []) {
        const dayTimestamp = truncateTimestampToMidnight(dataPoint.date);
        const existing = dateMap.get(dayTimestamp);

        // Keep only the latest timestamp for each date
        if (!existing || dataPoint.date > existing.timestamp) {
          dateMap.set(dayTimestamp, {
            timestamp: dataPoint.date,
            value: dataPoint.totalLiquidityUSD,
          });
        }
      }

      chainsByDate.set(chainKey, dateMap);
    }

    // Aggregate across chains
    const aggregatedByDate = new Map<
      number,
      { total: number; withoutOwnToken: number }
    >();

    for (const [chainKey, dateMap] of chainsByDate.entries()) {
      const isGlobalOwnTokens = chainKey === "OwnTokens";

      for (const [dayTimestamp, { value }] of dateMap.entries()) {
        let entry = aggregatedByDate.get(dayTimestamp);
        if (!entry) {
          entry = { total: 0, withoutOwnToken: 0 };
          aggregatedByDate.set(dayTimestamp, entry);
        }

        if (isGlobalOwnTokens) {
          // OwnTokens → adds to total only
          entry.total += value;
        } else {
          // Regular chain → adds to both
          entry.total += value;
          entry.withoutOwnToken += value;
        }
      }
    }

    // Convert map to array and format
    return Array.from(aggregatedByDate.entries())
      .map(([dayTimestamp, values]) => ({
        date: dayTimestamp,
        liquidTreasury: values.withoutOwnToken, // Liquid Treasury
      }))
      .sort((a, b) => a.date - b.date); // Sort by timestamp ascending
  }
}
