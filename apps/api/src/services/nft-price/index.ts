import axios, { AxiosInstance } from "axios";
import { formatEther } from "viem";
import { z } from "zod";

import {
  truncateTimestampToMidnight,
  calculateCutoffTimestamp,
} from "@/lib/date-helpers";
import { forwardFill, createDailyTimeline } from "@/lib/time-series";
import {
  PROVIDER_TIMEOUT_MS,
  UpstreamUnavailableError,
} from "@/lib/upstream-error";
import { logger } from "@/logger";
import { TokenHistoricalPriceResponse } from "@/mappers";
import { PriceProvider } from "@/services/treasury/types";

/** CoinGecko market chart bodies: `[millisecond timestamp, price]` pairs. */
const EthPricesSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

export interface NFTPriceRepository {
  getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse>;
  getTokenPrice(): Promise<string>;
}

export class NFTPriceService implements PriceProvider {
  private readonly client: AxiosInstance;

  constructor(
    private readonly repo: NFTPriceRepository,
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      timeout: PROVIDER_TIMEOUT_MS,
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

    logger.info(
      { from: fromQuery, to: toQuery },
      "fetching historical ETH prices from CoinGecko",
    );
    // The auction prices above come from PostgreSQL. Only the CoinGecko call is
    // tagged as an upstream failure, so a database error stays a real error
    // instead of degrading to an empty series. The mapping below reads one ETH
    // price per auction price, so a shorter series is a provider problem.
    const ethHistoricalPrices = await this.fetchEthPrices(
      `/coins/ethereum/market_chart/range?vs_currency=usd&from=${fromQuery}&to=${toQuery}`,
      auctionPrices.length,
    );

    const ethPriceResponse = ethHistoricalPrices.reverse().slice(0, limit);

    const rawPrices = auctionPrices.map(({ price, timestamp }, index) => ({
      price: (
        Number(formatEther(BigInt(price))) * ethPriceResponse[index]![1]
      ).toFixed(2),
      timestamp,
    }));

    // Create map with normalized timestamps (midnight UTC)
    const priceMap = new Map<number, string>();
    rawPrices.forEach((item) => {
      const normalizedTs = truncateTimestampToMidnight(item.timestamp);
      priceMap.set(normalizedTs, item.price);
    });

    // Create timeline and forward-fill gaps
    const timeline = createDailyTimeline(Math.min(...priceMap.keys()));
    const filledPrices = forwardFill(timeline, priceMap);

    // Filter to only include last `limit` days
    const cutoff = calculateCutoffTimestamp(limit);
    const filteredTimeline = timeline.filter((ts) => ts >= cutoff);

    return filteredTimeline.map((timestamp) => ({
      price: filledPrices.get(timestamp) ?? "0",
      timestamp,
    }));
  }

  async getTokenPrice(_: string, __: string): Promise<string> {
    const price = await this.repo.getTokenPrice();
    const nftEthValue = Number(formatEther(BigInt(price)));

    logger.info("fetching current ETH price from CoinGecko");
    const ethCurrentPrice = await this.fetchEthPrices(
      `/coins/ethereum/market_chart?vs_currency=usd&days=1`,
      1,
    );

    const ethPriceResponse = ethCurrentPrice.reverse().slice(0, 1);
    return (nftEthValue * ethPriceResponse[0]![1]).toFixed(2);
  }

  /**
   * Fetches ETH prices from CoinGecko and validates them before returning.
   * Transport failures, non-2xx, an unexpected body and a series too short for
   * the caller's mapping all become `UpstreamUnavailableError`, so the route
   * degrades instead of failing later with a 500 on a bad provider payload.
   */
  private async fetchEthPrices(
    path: string,
    minPrices: number,
  ): Promise<[number, number][]> {
    let body: unknown;
    try {
      body = (await this.client.get<unknown>(path)).data;
    } catch (error) {
      throw new UpstreamUnavailableError(
        "coingecko",
        "Failed to fetch ETH prices",
        { cause: error },
      );
    }

    const parsed = EthPricesSchema.safeParse(body);
    if (!parsed.success) {
      throw new UpstreamUnavailableError(
        "coingecko",
        "CoinGecko returned an unexpected ETH price shape",
        { cause: parsed.error },
      );
    }

    if (parsed.data.prices.length < minPrices) {
      throw new UpstreamUnavailableError(
        "coingecko",
        `CoinGecko returned ${parsed.data.prices.length} ETH prices, need ${minPrices}`,
      );
    }

    return parsed.data.prices;
  }

  async getHistoricalPricesMap(days: number): Promise<Map<number, number>> {
    const priceData = await this.getHistoricalTokenData(days, 0);

    const priceMap = new Map<number, number>();
    priceData.forEach((item) => {
      const normalizedTimestamp = truncateTimestampToMidnight(item.timestamp);
      priceMap.set(normalizedTimestamp, Number(item.price));
    });

    return priceMap;
  }
}
