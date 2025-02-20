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

  async getTotalAssets(): Promise<TotalAssetsByDay[]> {
    if (!this.cacheService) {
      const response = await this.duneService.fetchTotalAssets();
      return response.result.rows;
    }
    await this.cacheService.connect();
    const cachedData = await this.cacheService.get(
      `dao:${this.daoId}:total-assets`,
    );
    let formattedCachedData: DuneResponse | null = null;

    if (cachedData) {
      formattedCachedData = JSON.parse(cachedData);
    }

    const needToFetch =
      !formattedCachedData ||
      new Date(formattedCachedData.execution_ended_at).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0);

    if (!needToFetch) {
      await this.cacheService.disconnect();
      return formattedCachedData?.result.rows || [];
    }

    const duneResponse = await this.duneService.fetchTotalAssets();
    await this.cacheService.set(
      `dao:${this.daoId}:total-assets`,
      JSON.stringify(duneResponse),
    );
    await this.cacheService.disconnect();
    return duneResponse.result.rows;
  }
}
