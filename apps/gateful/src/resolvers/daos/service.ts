import { fanOutGet } from "../../shared/fan-out.js";
import { DaoResponse, DaosResponse } from "./route.js";

export type DaosResult = DaosResponse & { cacheControl: string | null };

export class DaosService {
  constructor(private readonly daoApis: Map<string, string>) {}

  async getAllDaos(): Promise<DaosResult> {
    const { data, cacheControl } = await fanOutGet<DaoResponse>(
      this.daoApis,
      "/dao",
    );

    const items = Array.from(data.values());

    return {
      items,
      totalCount: items.length,
      cacheControl,
    };
  }
}
