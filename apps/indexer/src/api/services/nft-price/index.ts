import { formatEther } from "viem";
import axios, { AxiosInstance } from "axios";

import { TokenHistoricalPriceResponse } from "@/api/mappers";

interface Repository {
  getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse>;
  getTokenPrice(): Promise<string>;
}

export class NFTPriceService {
  private readonly client: AxiosInstance;

  constructor(
    private readonly repo: Repository,
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      headers: {
        "x-cg-demo-api-key": coingeckoApiKey,
      },
    });
  }

  async getHistoricalTokenData(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse> {
    const auctionPrices = await this.repo.getHistoricalNFTPrice(limit, offset);

    const today = new Date();
    const fromData = new Date(today);
    fromData.setDate(today.getDate() - limit);

    const fromQuery = fromData.toISOString().split("T")[0];
    const toQuery = today.toISOString().split("T")[0];

    const ethHistoricalPrices = await this.client.get<{
      prices: [number, number][];
    }>(
      `/coins/ethereum/market_chart/range?vs_currency=usd&from=${fromQuery}&to=${toQuery}`,
    );

    const ethPriceResponse = ethHistoricalPrices.data.prices
      .reverse()
      .slice(0, limit);

    return auctionPrices.map(({ price, timestamp }, index) => ({
      price: (
        Number(formatEther(BigInt(price))) * ethPriceResponse[index]![1]
      ).toFixed(2),
      timestamp: timestamp * 1000,
    }));
  }

  async getTokenPrice(_: string, __: string): Promise<string> {
    const price = await this.repo.getTokenPrice();
    const nftEthValue = Number(formatEther(BigInt(price)));

    const ethCurrentPrice = await this.client.get<{
      prices: [number, number][];
    }>(`/coins/ethereum/market_chart?vs_currency=usd&days=1`);

    const ethPriceResponse = ethCurrentPrice.data.prices.reverse().slice(0, 1);
    return (nftEthValue * ethPriceResponse[0]![1]).toFixed(2);
  }
}
