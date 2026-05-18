import type { DAOClient } from "@/clients";
import type { HealthRepository } from "@/repositories";

const FRESHNESS_MAX_LAG_SECONDS = 300;

export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthReport {
  status: HealthStatus;
  database: "ok" | "error";
  chain: { head: number | null };
  indexer: {
    lastEventTimestamp: number | null;
    lagSeconds: number | null;
    fresh: boolean;
  };
}

export class HealthService {
  constructor(
    private readonly repo: HealthRepository,
    private readonly daoClient: DAOClient,
  ) {}

  async getHealth(): Promise<HealthReport> {
    const [dbResult, headResult, lastTsResult] = await Promise.allSettled([
      this.repo.pingDatabase(),
      this.daoClient.getCurrentBlockNumber(),
      this.repo.getLastEventTimestamp(),
    ]);

    const database = dbResult.status === "fulfilled" ? "ok" : "error";
    const head = headResult.status === "fulfilled" ? headResult.value : null;
    const lastEventTimestamp =
      lastTsResult.status === "fulfilled" ? lastTsResult.value : null;

    const now = Math.floor(Date.now() / 1000);
    const lagSeconds =
      lastEventTimestamp !== null ? now - lastEventTimestamp : null;
    const fresh =
      lagSeconds !== null && lagSeconds <= FRESHNESS_MAX_LAG_SECONDS;

    let status: HealthStatus;
    if (database === "error") status = "error";
    else if (!fresh) status = "degraded";
    else status = "ok";

    return {
      status,
      database,
      chain: { head },
      indexer: { lastEventTimestamp, lagSeconds, fresh },
    };
  }
}
