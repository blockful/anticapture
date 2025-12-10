import { HTTPException } from "hono/http-exception";
import { TreasuryDataPoint } from "../types";
import { TreasuryProvider } from "./treasury-provider.interface";
import { AxiosInstance } from "axios";

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
      totalAssets: string;
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

  async fetchTreasury(): Promise<TreasuryDataPoint[]> {
    try {
      const response = await this.client.get<DuneResponse>("/", {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      return this.transformData(response.data);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch total assets data",
        cause: error,
      });
    }
  }

  private transformData(data: DuneResponse): TreasuryDataPoint[] {
    return data.result.rows.map((row) => {
      // Parse date string "YYYY-MM-DD" and convert to Unix timestamp (seconds)
      const [year, month, day] = row.date.split("-").map(Number);
      if (!year || !month || !day) {
        throw new Error(`Invalid date string: ${row.date}`);
      }
      const timestamp = Math.floor(Date.UTC(year, month - 1, day) / 1000);
      return {
        date: BigInt(timestamp),
        totalTreasury: BigInt(row.totalAssets),
        treasuryWithoutDaoToken: 0n, // TODO: Implement this
      };
    });
  }
}
