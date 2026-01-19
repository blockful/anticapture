import { HTTPException } from "hono/http-exception";
import { LiquidTreasuryDataPoint } from "../types";
import { TreasuryProvider } from "./treasury-provider.interface";
import { AxiosInstance } from "axios";
import { TreasuryProviderCache } from "./provider-cache";

export interface DuneResponse {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: {
    rows: {
      date: string;
      totalAssets: number;
    }[];
  };
  next_uri: string;
  next_offset: number;
}

export class DuneProvider implements TreasuryProvider {
  private readonly cache = new TreasuryProviderCache();

  constructor(
    private readonly client: AxiosInstance,
    private readonly apiKey: string,
  ) {}

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    const cached = this.cache.get();

    if (cached !== null) return this.filterData(cached, cutoffTimestamp);

    try {
      const response = await this.client.get<DuneResponse>("/", {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });
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

  private transformData(data: DuneResponse): LiquidTreasuryDataPoint[] {
    return data.result.rows
      .map((row) => {
        // Parse date string "YYYY-MM-DD" and convert to Unix timestamp (seconds)
        const [year, month, day] = row.date.split("-").map(Number);
        if (!year || !month || !day) {
          throw new Error(`Invalid date string: ${row.date}`);
        }
        const timestamp = Math.floor(Date.UTC(year, month - 1, day) / 1000);
        return {
          date: timestamp,
          liquidTreasury: row.totalAssets ?? 0,
        };
      })
      .sort((a, b) => a.date - b.date);
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
