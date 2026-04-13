import type { CircuitBreakerRegistry } from "../../shared/circuit-breaker-registry.js";
import { fanOutGet } from "../../shared/fan-out.js";

import { DaoResponse, DaosResponse } from "./route.js";

export class DaosService {
  constructor(
    private readonly daoApis: Map<string, string>,
    private readonly registry: CircuitBreakerRegistry,
  ) {}

  async getAllDaos(): Promise<DaosResponse> {
    const responses = await fanOutGet<DaoResponse>(
      this.daoApis,
      this.registry,
      "/dao",
    );
    const items = Array.from(responses.values());

    return {
      items,
      totalCount: items.length,
    };
  }
}
