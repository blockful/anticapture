import { formatUnits } from "viem";

import type { Humanized } from "@/shared/services/decoder/types";

const trimAndGroup = (formatted: string): string => {
  const [whole, fraction = ""] = formatted.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Beyond 4 fraction digits the tail is noise for a governance reader; the
  // raw value stays available as the dimmed annotation.
  const trimmed = fraction.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${groupedWhole}.${trimmed}` : groupedWhole;
};

/** "25000000000" with 6 decimals and "USDC" -> "25,000 USDC". */
export const humanizeTokenAmount = (
  value: bigint,
  decimals: number,
  symbol: string,
): Humanized => ({
  kind: "tokenAmount",
  text: `${trimAndGroup(formatUnits(value, decimals))} ${symbol}`,
  symbol,
  decimals,
});

/** Wei -> "1.5 ETH". Used for the `value` attached to a call. */
export const humanizeEtherValue = (wei: bigint): Humanized => ({
  kind: "etherValue",
  text: `${trimAndGroup(formatUnits(wei, 18))} ETH`,
});
