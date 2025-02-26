import { DaoIdEnum } from "@/lib/enums";
import { TotalAssetsByDay, DuneResponse } from "@/api/services/dune/types";
import { CacheServiceInterface } from "@/api/services/cache/cache.service.interface";
import { DuneServiceInterface } from "@/api/services/dune/dune.service.interface";

export class AssetsService {
  constructor(
    private readonly daoId: DaoIdEnum,
    private readonly duneService: DuneServiceInterface,
    private readonly cacheService?: CacheServiceInterface<string>,
  ) {}

  async getTotalAssets(size: number = 90): Promise<TotalAssetsByDay[]> {
    if (!this.cacheService) {
      const response = await this.duneService.fetchTotalAssets(size);
      return response.result.rows;
    }

    const cachedData = await this.cacheService.get(
      `dao:${this.daoId}:total-assets:${size}`,
    );
    let formattedCachedData = cachedData
      ? (JSON.parse(cachedData) as DuneResponse)
      : null;

    if (formattedCachedData) {
      return formattedCachedData?.result.rows || [];
    }

    const duneResponse = await this.duneService.fetchTotalAssets(size);
    await this.cacheService.set(
      `dao:${this.daoId}:total-assets:${size}`,
      JSON.stringify(duneResponse),
    );
    return duneResponse.result.rows;
  }
}
