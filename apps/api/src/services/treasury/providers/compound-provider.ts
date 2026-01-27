import { HTTPException } from "hono/http-exception";
import { LiquidTreasuryDataPoint } from "../types";
import { TreasuryProvider } from "./treasury-provider.interface";
import { AxiosInstance } from "axios";
import { TreasuryProviderCache } from "./provider-cache";

const LIMIT = 36500; // Est. ~100 different assets * 365d, so as to not pull too much data (1y) for performance reasons
const COMP_TOKEN_IDS = new Set([
  7, 12, 13, 17, 30, 40, 42, 43, 44, 50, 51, 52, 53, 54, 55, 56, 57, 58, 63, 69,
  71, 78, 80, 84, 90, 92,
]); // `sId`s relating to the COMP governance token on different plaforms

export interface CompoundResponse {
  data: {
    id: number;
    q: string;
    p: number;
    v: number;
    d: number;
    sId: number;
  }[];
  meta: {
    limit: number;
    offset: number;
    total: number;
  };
}

export class CompoundProvider implements TreasuryProvider {
  private readonly cache = new TreasuryProviderCache();

  constructor(private readonly client: AxiosInstance) {}

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    const cached = this.cache.get();

    if (cached !== null) return this.filterData(cached, cutoffTimestamp);

    try {
      const response = await this.client.get<CompoundResponse>(
        `/treasury?order=DESC&limit=${LIMIT}`,
      );
      const data = this.transformData(response.data);
      this.cache.set(data);

      return this.filterData(data, cutoffTimestamp);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch total assets data",
        cause: error,
      });
    }
  }

  private transformData(data: CompoundResponse): LiquidTreasuryDataPoint[] {
    const map = new Map();
    data.data.forEach((row) => {
      const timestamp = row.d;
      if (!COMP_TOKEN_IDS.has(row.sId)) {
        map.set(timestamp, (map.get(timestamp) || 0) + row.v);
      }
    });

    return Array.from(map, ([date, value]) => ({
      date,
      liquidTreasury: value,
    })).sort((a, b) => a.date - b.date);
  }

  private filterData(
    data: LiquidTreasuryDataPoint[],
    cutoffTimestamp: number,
  ): LiquidTreasuryDataPoint[] {
    const filteredData = data.filter((item) => item.date >= cutoffTimestamp);
    if (filteredData.length === 0 && data.length > 0) {
      const lastAvailable = data.at(-1)!;
      return [lastAvailable];
    }

    return filteredData;
  }
}
