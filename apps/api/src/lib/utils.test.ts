import { describe, expect, it } from "vitest";
import { calculatePercentage } from "@/lib/utils";

describe("calculatePercentage", () => {
  it("should calculate percentage correctly", () => {
    // previous = 110 - 10 = 100, (10 * 10000) / 100 / 100 = 10
    const result = calculatePercentage(110, 10);

    expect(result).toBe("10");
  });

  it("should return '0' when previous is 0 (base equals variation)", () => {
    // previous = 10 - 10 = 0, returns 0
    const result = calculatePercentage(10, 10);

    expect(result).toBe("0");
  });

  it("should return '0' when both base and variation are 0", () => {
    // previous = 0 - 0 = 0, returns 0
    const result = calculatePercentage(0, 0);

    expect(result).toBe("0");
  });

  it("should work with bigint inputs", () => {
    // previous = 110n - 10n = 100n, (10n * 10000n) / 100n / 100 = 10
    const result = calculatePercentage(110n, 10n);

    expect(result).toBe("10");
  });

  it("should work with string inputs", () => {
    // previous = 110 - 10 = 100, (10 * 10000) / 100 / 100 = 10
    const result = calculatePercentage("110", "10");

    expect(result).toBe("10");
  });

  it("should handle large numbers correctly", () => {
    // previous = 2000 - 1000 = 1000, (1000 * 10000) / 1000 / 100 = 100
    const result = calculatePercentage(20000000000, 10000000000);

    expect(result).toBe("100");
  });

  it("should return '0' when variation is 0 and previous is non-zero", () => {
    // previous = 100 - 0 = 100, (0 * 10000) / 100 / 100 = 0
    const result = calculatePercentage(100, 0);

    expect(result).toBe("0");
  });
});
