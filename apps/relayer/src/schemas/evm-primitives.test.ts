import { describe, it, expect } from "vitest";
import { maxUint256 } from "viem";

import { DecimalUint256Schema } from "./evm-primitives";

describe("DecimalUint256Schema", () => {
  it("parses a canonical decimal string", () => {
    expect(DecimalUint256Schema.parse("42")).toBe(42n);
  });

  it("accepts the uint256 maximum", () => {
    expect(DecimalUint256Schema.parse(maxUint256.toString())).toBe(maxUint256);
  });

  it("rejects values above the uint256 maximum", () => {
    expect(() =>
      DecimalUint256Schema.parse((maxUint256 + 1n).toString()),
    ).toThrow();
  });

  it("rejects digit strings longer than a uint256 can hold", () => {
    expect(() => DecimalUint256Schema.parse("1".repeat(79))).toThrow();
  });

  it("rejects non-decimal input", () => {
    expect(() => DecimalUint256Schema.parse("0x2a")).toThrow();
  });
});
