import { DaoIdEnum } from "@/lib/enums";
import { DuneResponse, TotalAssetsByDay } from "./types";

export class DuneService {
  private daoId: DaoIdEnum;
  private duneUrl: string;
  private apiKey: string;

  constructor(daoId: DaoIdEnum, duneUrl: string, apiKey: string) {
    this.daoId = daoId;
    this.duneUrl = duneUrl;
    this.apiKey = apiKey;
  }
  async getTotalAssets() {
    const attackProfitabilityFromApi = await fetch(this.duneUrl, {
      headers: {
        "X-Dune-API-Key": this.apiKey,
      },
    });
    const {
      result: { rows },
    } = (await attackProfitabilityFromApi.json()) as DuneResponse;

    return rows as TotalAssetsByDay[];
  }
}
