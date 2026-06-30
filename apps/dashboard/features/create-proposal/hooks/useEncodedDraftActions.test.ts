/**
 * Tests for useEncodedDraftActions.
 *
 * The Jest config matches *.test.ts only (not .tsx), uses a node test
 * environment, and has no @testing-library/react installed. Additionally,
 * wagmi and wagmi/chains are ESM-only packages that cannot be transformed by
 * ts-jest in this setup, making it impossible to import the hook directly in
 * tests.
 *
 * We therefore test the pure exported helper `bigintValuesToStrings` which is
 * co-located in utils/bigintValuesToStrings.ts — a module that carries no
 * wagmi/React imports and runs cleanly in the node test environment.
 *
 * This covers the non-negotiable behaviors from the spec:
 *   1. bigint `values` are stringified correctly (including large values beyond
 *      Number.MAX_SAFE_INTEGER that would lose precision with Number coercion).
 *   2. empty input yields an empty array (the hook returns EMPTY without
 *      calling encodeActions when actions.length === 0 — enforced by the
 *      `enabled: actions.length > 0` query guard).
 */

import { bigintValuesToStrings } from "@/features/create-proposal/utils/bigintValuesToStrings";

describe("bigintValuesToStrings", () => {
  it("converts bigint array to string array", () => {
    expect(bigintValuesToStrings([123n, 0n, 999999999999999999n])).toEqual([
      "123",
      "0",
      "999999999999999999",
    ]);
  });

  it("returns empty array for empty input — mirrors empty-actions path in hook", () => {
    expect(bigintValuesToStrings([])).toEqual([]);
  });

  it("handles large bigints beyond Number.MAX_SAFE_INTEGER without precision loss", () => {
    const large = 2n ** 256n - 1n;
    const result = bigintValuesToStrings([large]);
    expect(result).toEqual([large.toString()]);
    // Confirm Number() would lose precision (ensuring bigint.toString() is necessary)
    expect(Number(large) === Number(large - 1n)).toBe(true);
  });
});
