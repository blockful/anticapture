import { vi } from "vitest";

import { DBInactiveVotingPowerSummary } from "@/mappers";

import { InactiveVotingPowerSummaryService } from "./inactive-summary";

const BLOCK_TIME = 12;

const createService = (summary: DBInactiveVotingPowerSummary) => {
  const getInactiveDelegatedVotingPowerSummary = vi
    .fn<() => Promise<DBInactiveVotingPowerSummary>>()
    .mockResolvedValue(summary);
  const daoClient = {
    getVotingPeriod: vi.fn().mockResolvedValue(100n),
    getVotingDelay: vi.fn().mockResolvedValue(20n),
  };
  const service = new InactiveVotingPowerSummaryService(
    { getInactiveDelegatedVotingPowerSummary },
    daoClient,
    BLOCK_TIME,
  );
  return { service, getInactiveDelegatedVotingPowerSummary };
};

describe("InactiveVotingPowerSummaryService", () => {
  it("derives the voting window from the DAO client and forwards the dates", async () => {
    const { service, getInactiveDelegatedVotingPowerSummary } = createService({
      totalDelegatedVotingPower: 1000n,
      inactiveDelegatedVotingPower: 250n,
      totalProposals: 3,
    });

    await service.getInactiveVotingPowerSummary(100, 200);

    // (votingPeriod + votingDelay) * blockTime = (100 + 20) * 12
    expect(getInactiveDelegatedVotingPowerSummary).toHaveBeenCalledWith(
      1440,
      100,
      200,
    );
  });

  it("computes the inactive percentage", async () => {
    const { service } = createService({
      totalDelegatedVotingPower: 1000n,
      inactiveDelegatedVotingPower: 250n,
      totalProposals: 3,
    });

    const result = await service.getInactiveVotingPowerSummary();

    expect(result).toEqual({
      totalDelegatedVotingPower: "1000",
      inactiveDelegatedVotingPower: "250",
      inactivePercentage: 25,
      totalProposals: 3,
    });
  });

  it("rounds the percentage to two decimal places", async () => {
    const { service } = createService({
      totalDelegatedVotingPower: 3000n,
      inactiveDelegatedVotingPower: 1000n,
      totalProposals: 1,
    });

    const result = await service.getInactiveVotingPowerSummary();

    expect(result.inactivePercentage).toBe(33.33);
  });

  it("reports zero inactivity when no proposal existed in the window", async () => {
    const { service } = createService({
      totalDelegatedVotingPower: 1000n,
      inactiveDelegatedVotingPower: 1000n,
      totalProposals: 0,
    });

    const result = await service.getInactiveVotingPowerSummary();

    expect(result).toEqual({
      totalDelegatedVotingPower: "1000",
      inactiveDelegatedVotingPower: "0",
      inactivePercentage: 0,
      totalProposals: 0,
    });
  });

  it("reports zero percentage when there is no delegated voting power", async () => {
    const { service } = createService({
      totalDelegatedVotingPower: 0n,
      inactiveDelegatedVotingPower: 0n,
      totalProposals: 2,
    });

    const result = await service.getInactiveVotingPowerSummary();

    expect(result.inactivePercentage).toBe(0);
  });
});
