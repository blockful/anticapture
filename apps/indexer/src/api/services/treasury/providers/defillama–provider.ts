import { AxiosInstance } from "axios";
import { TreasuryProvider } from "./treasury-provider.interface";
import { LiquidTreasuryDataPoint } from "../types";
import { truncateTimestampToMidnight } from "@/lib/date-helpers";
import { filterWithFallback } from "@/lib/query-helpers";

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
  private readonly client: AxiosInstance;
  private readonly providerDaoId: string;

  constructor(client: AxiosInstance, providerDaoId: string) {
    this.client = client;
    this.providerDaoId = providerDaoId;
  }

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    try {
      const response = await this.client.get<RawDefiLlamaResponse>(
        `/${this.providerDaoId}`,
      );

      return this.transformData(response.data, cutoffTimestamp);
    } catch (error) {
      console.error(
        `[DefiLlamaProvider] Failed to fetch treasury data for ${this.providerDaoId}:`,
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
    cutoffTimestamp: number,
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
    const allData = Array.from(aggregatedByDate.entries())
      .map(([dayTimestamp, values]) => ({
        date: dayTimestamp,
        liquidTreasury: values.withoutOwnToken, // Liquid Treasury
      }))
      .sort((a, b) => a.date - b.date); // Sort by timestamp ascending

    return filterWithFallback(allData, cutoffTimestamp);
  }
}
