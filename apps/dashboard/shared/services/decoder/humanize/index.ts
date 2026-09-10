import {
  DURATION_FUNCTION_HINT,
  DURATION_NAME_EXCLUDE,
  DURATION_NAME_HINT,
  humanizeDuration,
} from "@/shared/services/decoder/humanize/duration";
import { humanizeNumber } from "@/shared/services/decoder/humanize/number";
import {
  humanizeTimestamp,
  TIMESTAMP_NAME_HINT,
} from "@/shared/services/decoder/humanize/timestamp";
import type { Humanized } from "@/shared/services/decoder/types";

export { humanizeDuration } from "@/shared/services/decoder/humanize/duration";
export { humanizeNumber } from "@/shared/services/decoder/humanize/number";
export { humanizeTimestamp } from "@/shared/services/decoder/humanize/timestamp";
export {
  humanizeEtherValue,
  humanizeTokenAmount,
} from "@/shared/services/decoder/humanize/tokenAmount";

export type LeafContext = {
  /** Solidity type of the leaf, e.g. "uint256". */
  type: string;
  /** ABI parameter name; hints at what the number means. */
  name: string;
  functionName?: string;
};

/**
 * Best sync reading for a decoded leaf. Precedence: timestamp > duration >
 * plain grouped number. Token amounts arrive later via async enrichment, and
 * addresses only get flagged (identity is resolved in the UI).
 */
export const humanizeLeaf = (
  ctx: LeafContext,
  value: unknown,
): Humanized | null => {
  if (typeof value !== "bigint") return null;
  if (!/^u?int/.test(ctx.type)) return null;

  if (TIMESTAMP_NAME_HINT.test(ctx.name)) {
    const timestamp = humanizeTimestamp(value);
    if (timestamp) return timestamp;
  }

  const votingScoped =
    DURATION_NAME_EXCLUDE.test(ctx.name) ||
    (ctx.functionName !== undefined &&
      DURATION_NAME_EXCLUDE.test(ctx.functionName));
  const isDurationParam =
    !votingScoped &&
    (DURATION_NAME_HINT.test(ctx.name) ||
      (ctx.functionName !== undefined &&
        DURATION_FUNCTION_HINT.has(ctx.functionName)));
  if (isDurationParam) {
    const duration = humanizeDuration(value);
    if (duration) return duration;
  }

  return humanizeNumber(value);
};
