import { fanOutGet } from "../shared/fan-out.js";

export class DaosService {
  constructor(private readonly daoApis: Map<string, string>) {}

  async getAllDaos() {
    const responses = await fanOutGet(this.daoApis, "/dao");
    const items = Array.from(responses.values());

    return {
      items,
      totalCount: items.length,
    };
  }
}
