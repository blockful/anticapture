import { DaoIdEnum } from "@/lib/enums";
import { TotalAssetsByDay, DuneResponse } from "../dune/types";
import { CacheServiceInterface } from "../cache/cache.service.interface";
import { DuneServiceInterface } from "../dune/dune.service.interface";

export class AssetsService {
  constructor(
    private readonly daoId: DaoIdEnum,
    private readonly duneService: DuneServiceInterface,
    private readonly cacheService?: CacheServiceInterface<string>,
  ) {}

  async getTotalAssets(size: number): Promise<TotalAssetsByDay[]> {
    if (!this.cacheService) {
      const response = await this.duneService.fetchTotalAssets(size);
      return response.result.rows;
    }
    const cachedData = await this.cacheService.get(
      `dao:${this.daoId}:total-assets`,
    );
    let formattedCachedData = JSON.parse(cachedData || "") as DuneResponse;

    if (formattedCachedData) {
      const needToFetch =
        // If the cache data is from the previous day, we need to fetch the data from the API
        new Date(formattedCachedData.execution_ended_at).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0);
      if (!needToFetch) {
        return formattedCachedData?.result.rows || [];
      }
    }

    const duneResponse = await this.duneService.fetchTotalAssets(size);
    await this.cacheService.set(
      `dao:${this.daoId}:total-assets`,
      JSON.stringify(duneResponse)
    );
    return duneResponse.result.rows;
  }
}
