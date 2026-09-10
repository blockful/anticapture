import type { Humanized } from "@/shared/services/decoder/types";

const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superscript = (n: number): string =>
  String(n)
    .split("")
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join("");

const group = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Past this many digits a grouped integer stops being readable (a 25-digit
 * "1,000,000,000,000,000,000,000,000" is three lines on a phone) and is
 * almost always a token amount whose decimals we could not resolve.
 */
const COMPACT_DIGITS = 15;

/** Decimal scales tried, most common first, when compacting a huge value. */
const COMMON_SCALES = [18, 8, 6] as const;

/**
 * Thousands grouping for every uint/int leaf with no better reading. Huge
 * values compact to `34,450 × 10¹⁸` when they divide by a common token scale
 * (the reader sees the likely human amount and the exponent at once), or to
 * scientific notation otherwise. The exact raw value stays in the annotation.
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

  for (const scale of COMMON_SCALES) {
    const unit = 10n ** BigInt(scale);
    if (abs % unit === 0n) {
      return {
        kind: "number",
        text: `${sign}${group((abs / unit).toString())} × 10${superscript(scale)}`,
      };
    }
  }

  const mantissa = `${digits[0]}.${digits.slice(1, 4)}`;
  return { kind: "number", text: `${sign}${mantissa}e${digits.length - 1}` };
};
