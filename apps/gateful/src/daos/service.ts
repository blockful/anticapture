import { fanOutGet } from "../shared/fan-out.js";

import { DaoResponse, DaosResponse } from "./route.js";

export class DaosService {
  constructor(private readonly daoApis: Map<string, string>) {}

  async getAllDaos(): Promise<DaosResponse> {
    const responses = await fanOutGet<DaoResponse>(this.daoApis, "/dao");
    const items = Array.from(responses.values());

    return {
      items,
      totalCount: items.length,
    };
  }
}
