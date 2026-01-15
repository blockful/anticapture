import { HTTPException } from "hono/http-exception";
import { LiquidTreasuryDataPoint } from "../types";
import { TreasuryProvider } from "./treasury-provider.interface";
import { AxiosInstance } from "axios";

const LIMIT = 36500; // Est. ~100 different assets * 365d

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
  constructor(private readonly client: AxiosInstance) {}

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    try {
      const response = await this.client.get<CompoundResponse>(
        `/treasury?order=DESC&limit=${LIMIT}`,
      );

      return this.transformData(response.data, cutoffTimestamp);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch total assets data",
        cause: error,
      });
    }
  }

  private transformData(
    data: CompoundResponse,
    cutoffTimestamp: number,
  ): LiquidTreasuryDataPoint[] {
    const map = new Map();
    data.data.forEach((row) => {
      const timestamp = row.d;
      map.set(timestamp, (map.get(timestamp) || 0) + row.v);
    });

    const filteredData = Array.from(map, ([date, value]) => ({
      date,
      liquidTreasury: value,
    }))
      .filter((item) => item.date >= cutoffTimestamp)
      .sort((a, b) => a.date - b.date);

    return filteredData;
  }
}
