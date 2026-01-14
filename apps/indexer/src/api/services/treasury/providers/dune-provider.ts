import { HTTPException } from "hono/http-exception";
import { AxiosInstance } from "axios";
import { LiquidTreasuryDataPoint } from "../types";
import { TreasuryProvider } from "./treasury-provider.interface";
import { filterWithFallback } from "@/lib/time-series";

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
  constructor(
    private readonly client: AxiosInstance,
    private readonly apiKey: string,
  ) {}

  async fetchTreasury(
    cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    try {
      const response = await this.client.get<DuneResponse>("/", {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      return this.transformData(response.data, cutoffTimestamp);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch total assets data",
        cause: error,
      });
    }
  }

  private transformData(
    data: DuneResponse,
    cutoffTimestamp: number,
  ): LiquidTreasuryDataPoint[] {
    const allData = data.result.rows
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

    return filterWithFallback(allData, (item) => item.date >= cutoffTimestamp);
  }
}
