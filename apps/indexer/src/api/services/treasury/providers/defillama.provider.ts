import { HTTPException } from "hono/http-exception";
import axios, { AxiosInstance } from "axios";
import { TreasuryProvider } from "./treasury-provider.interface";
import { TreasuryDataPoint, RawDefiLlamaResponse } from "../types";

export class DefiLlamaProvider implements TreasuryProvider {
  private readonly client: AxiosInstance;

  // DAO ID mapping encapsulated in provider
  // Based on Phase 0 research - internal IDs are UPPERCASE, DeFi Llama IDs vary
  private readonly daoMapping: Record<string, string> = {
    ENS: "ENS", // Case-sensitive!
    UNI: "uniswap",
    OP: "optimism-foundation",
    ARB: "arbitrum-dao",
    GTC: "gitcoin",
    NOUNS: "nouns",
    // SCR (Scroll) - Not available in DeFi Llama
  };

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
    });
  }

  getSupportedDaos(): string[] {
    return Object.keys(this.daoMapping);
  }

  async fetchTreasury(daoId: string): Promise<TreasuryDataPoint[]> {
    // 1. Validate DAO support
    const llamaDaoId = this.daoMapping[daoId];
    if (!llamaDaoId) {
      throw new HTTPException(400, {
        message: `DAO '${daoId}' not supported by DeFi Llama provider`,
      });
    }

    // 2. Fetch from DeFi Llama API
    try {
      const response = await this.client.get<RawDefiLlamaResponse>(
        `/${llamaDaoId}`,
      );

      // 3. Transform DeFi Llama format → our format
      return this.transformData(response.data);
    } catch (error) {
      throw new HTTPException(503, {
        message: `Failed to fetch treasury data from DeFi Llama for DAO '${daoId}'`,
        cause: error,
      });
    }
  }

  /**
   * Transforms DeFi Llama's raw response into our standardized format.
   * Replicates DeFi Llama's aggregation logic from Phase 0 research.
   */
  private transformData(rawData: RawDefiLlamaResponse): TreasuryDataPoint[] {
    const { chainTvls } = rawData;

    // Map: chainKey → Map(dayTimestamp → latest dataPoint)
    const chainsByDate = new Map<
      string,
      Map<bigint, { timestamp: number; value: number }>
    >();

    // First pass: For each chain, keep only the latest timestamp per date
    for (const [chainKey, chainData] of Object.entries(chainTvls)) {
      // Only process base chains (no hyphens) and global OwnTokens
      if (chainKey.includes("-")) {
        continue; // Skip {Chain}-OwnTokens variants
      }

      const dateMap = new Map<bigint, { timestamp: number; value: number }>();

      for (const dataPoint of chainData.tvl || []) {
        const dayTimestamp = this.timestampToStartOfDay(dataPoint.date);
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

    // Second pass: Aggregate across chains
    const aggregatedByDate = new Map<
      bigint,
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
        totalTreasury: BigInt(values.total),
        treasuryWithoutDaoToken: BigInt(values.withoutOwnToken),
      }))
      .sort((a, b) => Number(a.date - b.date)); // Sort by timestamp ascending
  }

  /**
   * Converts Unix timestamp to start of day timestamp (in seconds).
   * Normalizes timestamps to UTC midnight.
   */
  private timestampToStartOfDay(timestamp: number): bigint {
    const date = new Date(timestamp * 1000); // DeFi Llama uses seconds
    date.setUTCHours(0, 0, 0, 0);
    return BigInt(Math.floor(date.getTime() / 1000));
  }
}
