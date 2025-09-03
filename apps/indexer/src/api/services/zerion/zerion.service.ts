import { HTTPException } from "hono/http-exception";
import {
  ZerionDaoLiquidTreasury,
  ZerionWalletPositionsResponse,
} from "./types";

export class ZerionService {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  private getAuthHeader() {
    const token = Buffer.from(`${this.apiKey}:`).toString("base64");
    return `Basic ${token}`;
  }

  async fetchWalletPositions(
    address: string,
  ): Promise<ZerionWalletPositionsResponse> {
    try {
      const options = {
        headers: {
          Authorization: this.getAuthHeader(),
          accept: "application/json",
        },
      };

      const response = await fetch(
        `${this.apiUrl}/wallets/${address}/positions`,
        options,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data as ZerionWalletPositionsResponse;
    } catch (error) {
      throw new HTTPException(503, {
        message: `Failed to fetch wallet positions for ${address}`,
        cause: error,
      });
    }
  }

  async fetchDaoLiquidTreasury(
    addresses: string[],
    governanceTokenSymbol: string,
  ): Promise<ZerionDaoLiquidTreasury> {
    try {
      const positions = await Promise.all(
        addresses.map((address) => this.fetchWalletPositions(address)),
      );

      const positionsFlat = positions.map((pos) => pos.data).flat();

      const governanceSymbol = governanceTokenSymbol.toLowerCase();

      const { totalUSD, governanceUSD } = positionsFlat.reduce(
        (acc, item) => {
          const valueUSD = item.attributes.value ?? 0;
          const symbol = item.attributes.fungible_info.symbol?.toLowerCase();

          acc.totalUSD += valueUSD;

          if (symbol === governanceSymbol) {
            acc.governanceUSD += valueUSD;
          }

          return acc;
        },
        { totalUSD: 0, governanceUSD: 0 },
      );

      return {
        totalUSD,
        governanceUSD,
        liquidUSD: totalUSD - governanceUSD,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HTTPException(500, {
        message: "Failed to calculate DAO liquid treasury",
        cause: error,
      });
    }
  }
}
