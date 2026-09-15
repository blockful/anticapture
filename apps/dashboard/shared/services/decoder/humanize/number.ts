import { formatUnits } from "viem";

import type { Humanized } from "@/shared/services/decoder/types";

const group = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Past this many digits a grouped integer stops being readable (a 25-digit
 * "1,000,000,000,000,000,000,000,000" is three lines on a phone) and is
 * almost always a token amount whose decimals we could not resolve.
 */
const COMPACT_DIGITS = 15;

/**
 * Huge values are read at the 18-decimal scale every governance token uses.
 * Guessing the scale from trailing zeros was tried and misleads: 59,998.98
 * COMP has only 16 trailing zeros and came out as "599,989,800,000,000 × 10⁸".
 * A fixed scale keeps neighbouring amounts comparable at a glance.
 */
const COMPACT_SCALE = 18;
const COMPACT_FRACTION_DIGITS = 4;

/**
 * Thousands grouping for every uint/int leaf with no better reading. Values
 * past fifteen digits compact to `59,998.98 × 10¹⁸`: the likely human amount
 * and the exponent at once, with the exact raw value in the annotation.
 */
export const humanizeNumber = (value: bigint): Humanized | null => {
  // Grouping "42" as "42" adds nothing; only large numbers earn an annotation.
  if (value > -10_000n && value < 10_000n) return null;
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  const digits = abs.toString();

  if (digits.length <= COMPACT_DIGITS) {
    return { kind: "number", text: `${sign}${group(digits)}` };
  }

  const [whole, fraction = ""] = formatUnits(abs, COMPACT_SCALE).split(".");
  const trimmed = fraction.slice(0, COMPACT_FRACTION_DIGITS).replace(/0+$/, "");
  const scaled = trimmed ? `${group(whole)}.${trimmed}` : group(whole);
  return { kind: "number", text: `${sign}${scaled} × 10¹⁸` };
};
