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
import { lookupRoleName } from "@/shared/services/decoder/roles";
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

/** A bytes32 named like a role, or any bytes32 handed to a role function. */
const ROLE_NAME_HINT = /role/i;
const ROLE_FUNCTION_HINT = new Set([
  "grantRole",
  "revokeRole",
  "renounceRole",
  "hasRole",
  "getRoleAdmin",
  "setRoleAdmin",
]);

/**
 * Best sync reading for a decoded leaf. Precedence: role name > timestamp >
 * duration > plain grouped number. Token amounts arrive later via async
 * enrichment, and addresses only get flagged (identity is resolved in the UI).
 */
export const humanizeLeaf = (
  ctx: LeafContext,
  value: unknown,
): Humanized | null => {
  if (
    ctx.type === "bytes32" &&
    typeof value === "string" &&
    (ROLE_NAME_HINT.test(ctx.name) ||
      (ctx.functionName !== undefined &&
        ROLE_FUNCTION_HINT.has(ctx.functionName)))
  ) {
    const role = lookupRoleName(value);
    return role ? { kind: "role", text: role } : null;
  }

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
