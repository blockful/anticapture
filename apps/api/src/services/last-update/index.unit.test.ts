import { describe, it, expect } from "vitest";
import { ChartType } from "@/mappers/";
import { LastUpdateService } from "./index";
import { LastUpdateRepository } from "@/repositories";

class SimpleLastUpdateRepository implements LastUpdateRepository {
  constructor(private readonly value: bigint | undefined) {}
  async getLastUpdate(_: ChartType) {
    return this.value;
  }
}

describe("LastUpdateService", () => {
  it("returns an ISO string derived from the bigint unix timestamp", async () => {
    const service = new LastUpdateService(
      new SimpleLastUpdateRepository(1700000000n),
    );

    const result = await service.getLastUpdate(ChartType.CostComparison);

    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("returns epoch ISO string when repository returns undefined", async () => {
    const service = new LastUpdateService(
      new SimpleLastUpdateRepository(undefined),
    );

    const result = await service.getLastUpdate(ChartType.AttackProfitability);
    expect(result).toBe("1970-01-01T00:00:00.000Z");
  });

  it("works for ChartType.AttackProfitability", async () => {
    const service = new LastUpdateService(
      new SimpleLastUpdateRepository(1700000000n),
    );

    const result = await service.getLastUpdate(ChartType.AttackProfitability);

    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("works for ChartType.TokenDistribution", async () => {
    const service = new LastUpdateService(
      new SimpleLastUpdateRepository(1700000000n),
    );

    const result = await service.getLastUpdate(ChartType.TokenDistribution);

    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
  });
});
