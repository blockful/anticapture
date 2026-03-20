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

  it("throws RangeError when repository returns undefined (NaN timestamp)", async () => {
    const service = new LastUpdateService(
      new SimpleLastUpdateRepository(undefined),
    );

    await expect(
      service.getLastUpdate(ChartType.AttackProfitability),
    ).rejects.toThrow(RangeError);
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
