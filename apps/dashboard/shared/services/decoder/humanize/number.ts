import type { Humanized } from "@/shared/services/decoder/types";

/** Thousands grouping for every uint/int leaf with no better reading. */
export const humanizeNumber = (value: bigint): Humanized | null => {
  // Grouping "42" as "42" adds nothing; only large numbers earn an annotation.
  if (value > -10_000n && value < 10_000n) return null;
  const sign = value < 0n ? "-" : "";
  const digits = (value < 0n ? -value : value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return { kind: "number", text: `${sign}${grouped}` };
};
