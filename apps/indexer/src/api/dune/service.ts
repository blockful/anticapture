import { DaoIdEnum } from "@/lib/enums";
import { DuneResponse, TotalAssetsByDay } from "./types";
import { createClient } from "redis";
import { RedisClientType } from "@redis/client";

export class DuneService {
  private daoId: DaoIdEnum;
  private duneUrl: string;
  private apiKey: string;
  private readonly redis?: RedisClientType;

  constructor(daoId: DaoIdEnum, duneUrl: string, apiKey: string) {
    this.daoId = daoId;
    this.duneUrl = duneUrl;
    this.apiKey = apiKey;
    if (!!process.env.REDIS_URL) {
      this.redis = createClient({
        url: process.env.REDIS_URL,
      });
    }
  }

  async getTotalAssets() {
    if (!this.redis) {
      console.log("Fetching new data from Dune");
      const duneResponse = await this.getTotalAssetsFromDune();
      return duneResponse.result.rows as TotalAssetsByDay[];
    }
    let cachedData: string | null = null;
    let formattedCachedData: DuneResponse | null = null;
    await this.redis.connect();
    cachedData = await this.redis.get(`dao:${this.daoId}:total-assets`);
    if (!!cachedData) {
      formattedCachedData = JSON.parse(cachedData || "") as DuneResponse;
    }
    const fetchAndCache =
      formattedCachedData === null ||
      new Date(formattedCachedData.execution_ended_at).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0);

    if (fetchAndCache) {
      console.log("Fetching new data from Dune and Caching");
      const duneResponse = await this.getTotalAssetsFromDune();
      const {
        result: { rows },
      } = duneResponse;
      await this.redis.set(
        `dao:${this.daoId}:total-assets`,
        JSON.stringify(duneResponse),
      );
      await this.redis.disconnect();
      return rows as TotalAssetsByDay[];
    }
    console.log("Using cached data from Dune");
    return formattedCachedData?.result.rows as TotalAssetsByDay[];
  }

  private async getTotalAssetsFromDune() {
    const attackProfitabilityFromApi = await fetch(this.duneUrl, {
      headers: {
        "X-Dune-API-Key": this.apiKey,
      },
    });
    const duneResponse =
      (await attackProfitabilityFromApi.json()) as DuneResponse;
    return duneResponse;
  }
}
