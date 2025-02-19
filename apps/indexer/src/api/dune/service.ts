import { DaoIdEnum } from "@/lib/enums";
import { DuneResponse, TotalAssetsByDay } from "./types";
import { CacheServiceInterface } from "@/lib/cache-service/types";

export class DuneService {
  private daoId: DaoIdEnum;
  private duneUrl: string;
  private apiKey: string;
  private readonly cacheService: CacheServiceInterface | null;

  constructor(
    daoId: DaoIdEnum,
    duneUrl: string,
    apiKey: string,
    cacheService: CacheServiceInterface | null,
  ) {
    this.daoId = daoId;
    this.duneUrl = duneUrl;
    this.apiKey = apiKey;
    this.cacheService = cacheService;
  }

  async getTotalAssets() {
    // if no cache service, fetch and return
    if (!this.cacheService) {
      const duneResponse = await this.getTotalAssetsFromDune();
      return duneResponse.result.rows as TotalAssetsByDay[];
    }
    let cachedData: string | null = null;
    let formattedCachedData: DuneResponse | null = null;
    cachedData = await this.cacheService.get(`dao:${this.daoId}:total-assets`);

    if (!!cachedData) {
      formattedCachedData = JSON.parse(cachedData || "") as DuneResponse;
    }

    const needToFetch =
      formattedCachedData === null ||
      new Date(formattedCachedData.execution_ended_at).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0);

    // return cached data
    if (!needToFetch) {
      return formattedCachedData?.result.rows as TotalAssetsByDay[];
    }
    // fetch and cache
    const duneResponse = await this.getTotalAssetsFromDune();
    const {
      result: { rows },
    } = duneResponse;
    await this.cacheService.set(
      `dao:${this.daoId}:total-assets`,
      JSON.stringify(duneResponse),
    );
    return rows as TotalAssetsByDay[];
  }

  private async getTotalAssetsFromDune() {
    const attackProfitabilityFromApi = await fetch(this.duneUrl, {
      headers: {
        "X-Dune-API-Key": this.apiKey,
      },
    });
    return (await attackProfitabilityFromApi.json()) as DuneResponse;
  }
}
