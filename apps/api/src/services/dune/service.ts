import { HTTPException } from "hono/http-exception";

import { DuneResponse } from "../treasury/providers/dune-provider";

export class DuneService {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async fetchLiquidTreasury(size: number): Promise<DuneResponse> {
    try {
      const response = await fetch(this.apiUrl + `?limit=${size}`, {
        headers: {
          "X-Dune-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DuneResponse;
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch liquid treasury data",
        cause: error,
      });
    }
  }
}
