import { DaoIdEnum } from "@/lib/enums";
import { CoingeckoService } from "../coingecko/coingecko.service";
import {
  CoingeckoHistoricalMarketData,
  CoingeckoTokenIdEnum,
} from "../coingecko/types";
import { CacheServiceInterface } from "../cache/cache.service.interface";

export class TokenHistoricalDataService {
  constructor(
    private readonly coingeckoService: CoingeckoService,
    private readonly cacheService?: CacheServiceInterface<string>,
  ) {}

  async getHistoricalTokenPrice(daoId: DaoIdEnum) {
    if (!this.cacheService) {
      const data = await this.coingeckoService.getHistoricalTokenData(
        CoingeckoTokenIdEnum[daoId],
      );
      return data;
    }

    const cachedData = await this.cacheService.get(
      `dao:${daoId}:historical-token-price`,
    );

    if (cachedData) {
      return JSON.parse(cachedData) as CoingeckoHistoricalMarketData;
    }
    const data = await this.coingeckoService.getHistoricalTokenData(
      CoingeckoTokenIdEnum[daoId],
    );

    await this.cacheService.set(
      `dao:${daoId}:historical-token-price`,
      JSON.stringify(data),
    );
    return data;
  }
}
