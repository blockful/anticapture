import axios, { AxiosInstance } from "axios";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { truncateTimestampToMidnight } from "@/lib/date-helpers";
import {
  recordDegradedUpstream,
  type MaybeDegraded,
} from "@/lib/degraded-upstream";
import { DaoIdEnum } from "@/lib/enums";
import { StaleValueCache } from "@/lib/stale-cache";
import {
  isDegradableUpstreamStatus,
  PROVIDER_TIMEOUT_MS,
  UpstreamUnavailableError,
  upstreamRejectedRequest,
} from "@/lib/upstream-error";
import { logger } from "@/logger";
import { TokenHistoricalPriceResponse } from "@/mappers";
import { PriceProvider } from "@/services/treasury/types";

import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoIdToAssetPlatformId,
  CoingeckoTokenIdEnum,
} from "./types";

const createCoingeckoTokenPriceDataSchema = (
  tokenContractAddress: string,
  targetCurrency: string,
) =>
  z.object({
    [tokenContractAddress]: z.object({
      [targetCurrency]: z.number(),
    }),
  });

/** Serving prices older than this is worse than serving none. */
const STALE_PRICE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export class CoingeckoService implements PriceProvider {
  private readonly client: AxiosInstance;
  /**
   * Longest market chart fetched so far, ascending by timestamp. CoinGecko is
   * third-party data, so when it fails we serve the tail of this instead of a
   * 5xx the gateway would count against the whole DAO circuit breaker.
   */
  private readonly lastGoodPrices =
    new StaleValueCache<TokenHistoricalPriceResponse>(STALE_PRICE_MAX_AGE_MS);
  /**
   * Last good spot price, tagged with the currency it was quoted in. A USD
   * price served as an ETH quote would be wrong by three orders of magnitude,
   * so a stale value is only ever used for the currency it was fetched for.
   */
  private readonly lastGoodTokenPrice = new StaleValueCache<{
    currency: string;
    value: string;
  }>(STALE_PRICE_MAX_AGE_MS);

  constructor(
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
    private readonly daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      timeout: PROVIDER_TIMEOUT_MS,
      headers: {
        "x-cg-demo-api-key": coingeckoApiKey,
      },
    });
  }

  async getHistoricalPricesMap(
    days: number,
  ): Promise<MaybeDegraded<Map<number, number>>> {
    const { data: priceData, degraded } =
      await this.getHistoricalTokenData(days);

    const priceMap = new Map<number, number>();
    priceData.forEach((item) => {
      const normalizedTimestamp = truncateTimestampToMidnight(item.timestamp);
      priceMap.set(normalizedTimestamp, Number(item.price));
    });

    return { data: priceMap, degraded };
  }

  async getHistoricalTokenData(
    days: number = 365,
  ): Promise<MaybeDegraded<TokenHistoricalPriceResponse>> {
    const tokenId = CoingeckoTokenIdEnum[this.daoId];

    if (!tokenId) {
      throw new HTTPException(404, {
        message: "Token not found",
      });
    }

    logger.info(
      { tokenId, days },
      "fetching historical token prices from CoinGecko",
    );

    let data: CoingeckoHistoricalMarketData;
    try {
      data = await this.fetchMarketChart(tokenId, days);
    } catch (error) {
      // Only a CoinGecko outage degrades. Everything after this point is our
      // own code and must surface as a real error.
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      // Serve the tail of the longest series we hold: a request for 7 days is
      // the last 7 points of a 365 day chart.
      const stale = this.lastGoodPrices.get()?.slice(-days);
      if (!stale?.length) throw error;
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: "token_historical_prices",
        mode: "stale",
        reason: error.reason,
        error,
        context: { tokenId, days },
      });
      return { data: stale, degraded: true };
    }

    // CoinGecko returns timestamps in milliseconds, convert to seconds
    const prices = data.prices.map(([timestampMs, price]) => ({
      price: price.toFixed(4),
      timestamp: Math.floor(timestampMs / 1000),
    }));
    // An empty chart is a valid answer but useless as a fallback. Among fresh
    // entries the longest wins, since a longer series can be sliced to any
    // shorter window; an absent or expired one is always replaced.
    if (prices.length) {
      this.lastGoodPrices.setIf(
        prices,
        (current) => prices.length >= current.length,
      );
    }
    return { data: prices, degraded: false };
  }

  /**
   * Calls the market chart endpoint and validates the body. Transport
   * failures, timeouts, retryable statuses and an unexpected body are
   * CoinGecko being unhealthy. A rejection such as an unknown token id is our
   * misconfiguration and surfaces as a 502 instead of degrading silently.
   */
  private async fetchMarketChart(
    tokenId: string,
    days: number,
  ): Promise<CoingeckoHistoricalMarketData> {
    const path = `/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const body = await this.request(path);

    const { success, data } =
      CoingeckoHistoricalMarketDataSchema.safeParse(body);
    if (!success) {
      throw new UpstreamUnavailableError(
        "coingecko",
        "Failed to fetch historical token data",
      );
    }
    return data;
  }

  /**
   * One CoinGecko GET, with every transport outcome classified. Callers get
   * either a body, an `UpstreamUnavailableError` they may degrade, or a 502
   * they must not.
   */
  private async request(path: string): Promise<unknown> {
    try {
      return (await this.client.get<unknown>(path)).data;
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      if (status !== undefined && !isDegradableUpstreamStatus(status)) {
        throw upstreamRejectedRequest("coingecko", status, path);
      }
      logger.error({ err: error, path, status }, "CoinGecko request failed");
      throw new UpstreamUnavailableError(
        "coingecko",
        "Failed to fetch data from CoinGecko",
        { cause: error },
      );
    }
  }

  async getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<MaybeDegraded<string>> {
    const tokenId = CoingeckoTokenIdEnum[this.daoId];
    const assetPlatform = CoingeckoIdToAssetPlatformId[tokenId];
    const formattedAddress = tokenContractAddress.toLowerCase();
    logger.info(
      { assetPlatform, tokenContractAddress: formattedAddress, targetCurrency },
      "fetching token price from CoinGecko",
    );
    let value: string;
    try {
      value = await this.fetchSpotPrice(
        assetPlatform,
        formattedAddress,
        targetCurrency,
      );
    } catch (error) {
      if (!(error instanceof UpstreamUnavailableError)) throw error;
      // No invented price: without a last known one in the same currency the
      // caller gets the error. A made up number would be indistinguishable
      // from a real quote.
      const stale = this.lastGoodTokenPrice.get();
      if (stale?.currency !== targetCurrency) throw error;
      recordDegradedUpstream({
        upstream: error.upstream,
        resource: "token_properties",
        mode: "stale",
        reason: error.reason,
        error,
        context: { assetPlatform: assetPlatform ?? "unknown", targetCurrency },
      });
      return { data: stale.value, degraded: true };
    }

    this.lastGoodTokenPrice.set({ currency: targetCurrency, value });
    return { data: value, degraded: false };
  }

  /**
   * Fetches and validates one spot price. Validation lives in here, not in the
   * caller, so a 200 carrying a missing or mistyped price takes the same stale
   * path as a transport failure instead of escaping as a 503.
   */
  private async fetchSpotPrice(
    assetPlatform: string | undefined,
    formattedAddress: string,
    targetCurrency: string,
  ): Promise<string> {
    const body = await this.request(
      `/simple/token_price/${assetPlatform}?contract_addresses=${formattedAddress}&vs_currencies=${targetCurrency}`,
    );

    const { success, data: price } = createCoingeckoTokenPriceDataSchema(
      formattedAddress,
      targetCurrency,
    ).safeParse(body);

    if (!success) {
      throw new UpstreamUnavailableError(
        "coingecko",
        "Failed to fetch token property data",
      );
    }

    return price[formattedAddress]![targetCurrency]!.toString();
  }
}
