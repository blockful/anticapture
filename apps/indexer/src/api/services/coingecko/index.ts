import axios from "axios";

import { DAYS_IN_YEAR } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { TokenValueResponseType } from "@/api/mappers";

const CoingeckoTokenIdEnum: Record<DaoIdEnum, string> = {
  ENS: "ethereum-name-service",
  TEST: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
  OP: "optimism",
  GTC: "gitcoin",
  NOUNS: "nouns",
};

export class CoingeckoService {
  private readonly coingeckoApiUrl = "https://api.coingecko.com/api/v3";
  constructor(
    private readonly daoId: DaoIdEnum,
    private readonly coingeckoApiKey: string,
  ) {}

  async getHistoricalTokenData(
    days: number = DAYS_IN_YEAR,
  ): Promise<TokenValueResponseType> {
    const tokenId = CoingeckoTokenIdEnum[this.daoId];

    const response = await axios.get<{
      prices: [number, number][];
    }>(
      `${this.coingeckoApiUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          "x-cg-demo-api-key": this.coingeckoApiKey,
        },
      },
    );

    const data = await response.data.prices;

    return {
      items: data.map(([timestamp, price]) => ({
        timestamp,
        price: Number(price.toFixed(2)),
      })),
    };
  }
}
