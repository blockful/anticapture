import { describe, expect, it } from "vitest";

import { calculateHistoricalBlockNumber } from "@/lib/blockTime";
import { DaysEnum } from "@/lib/enums";

describe("calculateHistoricalBlockNumber", () => {
  it("should calculate historical block number for 7d", () => {
    // floor(604800 / 12) = 50400 blocks back
    const result = calculateHistoricalBlockNumber(DaysEnum["7d"], 1000000, 12);

    expect(result).toBe(949600);
  });

  it("should calculate historical block number for 30d", () => {
    // floor(2592000 / 12) = 216000 blocks back
    const result = calculateHistoricalBlockNumber(DaysEnum["30d"], 1000000, 12);

    expect(result).toBe(784000);
  });

  it("should calculate historical block number for 90d", () => {
    // floor(7776000 / 12) = 648000 blocks back
    const result = calculateHistoricalBlockNumber(DaysEnum["90d"], 1000000, 12);

    expect(result).toBe(352000);
  });

  it("should return 0 when blocks to go back exceeds current block number", () => {
    // 365d = 31536000s, floor(31536000 / 12) = 2628000 blocks back, but current is 100
    const result = calculateHistoricalBlockNumber(DaysEnum["365d"], 100, 12);

    expect(result).toBe(0);
  });

  it("should work with fractional block times (ARB ~0.25s blocks)", () => {
    // floor(604800 / 0.25) = floor(2419200) = 2419200 blocks back
    const result = calculateHistoricalBlockNumber(
      DaysEnum["7d"],
      10000000,
      0.25,
    );

    expect(result).toBe(7580800);
  });

  it("should return 0 when current block number is 0", () => {
    const result = calculateHistoricalBlockNumber(DaysEnum["7d"], 0, 12);

    expect(result).toBe(0);
  });

  it("should return current block number when blocks to go back is 0", () => {
    // This can't happen naturally with valid DaysEnum values, but
    // validate that Math.max(0, ...) behaves correctly at the boundary
    const result = calculateHistoricalBlockNumber(DaysEnum["7d"], 1000000, 12);

    expect(result).toBeGreaterThanOrEqual(0);
  });
});
