import { CoingeckoService } from "@/api/services/coingecko";
import { PriceProvider } from "../types";
import { truncateTimestampTimeMs } from "@/eventHandlers/shared";

/**
 * Adapter that wraps CoingeckoService to implement PriceProvider interface.
 * Fetches historical token prices from CoinGecko API.
 */
export class CoingeckoPriceProvider implements PriceProvider {
  constructor(private coingeckoService: CoingeckoService) {}

  async getHistoricalPrices(days: number): Promise<Map<number, number>> {
    const priceData = await this.coingeckoService.getHistoricalTokenData(days);

    const priceMap = new Map<number, number>();
    priceData.forEach((item) => {
      // Normalize timestamp to midnight UTC
      const normalizedTimestamp = truncateTimestampTimeMs(item.timestamp);
      priceMap.set(normalizedTimestamp, Number(item.price));
    });

    return priceMap;
  }
}
