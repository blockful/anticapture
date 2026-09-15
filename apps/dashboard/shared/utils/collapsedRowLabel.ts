import { humanizeEtherValue } from "@/shared/services/decoder/humanize";

export type CollapsedLabel = {
  /** Sentence when the decode produced one, else signature, else selector. */
  label: string;
  /** Dimmed suffix shown after the label when the label is a sentence. */
  signature?: string;
};

type CollapsedDecode = {
  summary: string | null;
  signature?: string;
};

/**
 * One-line label for a collapsed action row. Falls back through
 * sentence -> signature -> "selector 0x…" so the row is never blank while a
 * decode is still in flight. ETH attached to a real function call is material
 * to a governance reviewer and gets appended, since no function-summary
 * template mentions it.
 */
export const buildCollapsedRowLabel = (
  decoded: CollapsedDecode | undefined,
  calldata: string | null,
  value?: bigint,
): CollapsedLabel => {
  // Any non-empty payload qualifies, even one shorter than a 4-byte selector:
  // only the pure ETH transfer (no payload) skips the suffix, because its
  // decode summary already states the amount.
  const hasPayload = Boolean(calldata && calldata !== "0x");
  const withValue = (label: string): string =>
    hasPayload && value !== undefined && value > 0n
      ? `${label} · sends ${humanizeEtherValue(value).text}`
      : label;

  if (decoded?.summary) {
    return { label: withValue(decoded.summary), signature: decoded.signature };
  }
  if (decoded?.signature) {
    return { label: withValue(decoded.signature) };
  }
  if (calldata && /^0x[0-9a-fA-F]{8}/.test(calldata)) {
    return { label: withValue(`selector ${calldata.slice(0, 10)}`) };
  }
  if (hasPayload && calldata) {
    // Sub-4-byte payload: no selector to name, but the call is not empty.
    return { label: withValue(`calldata ${calldata}`) };
  }
  // Empty calldata with attached value summarizes as an ETH transfer above;
  // reaching here means no summary exists, so nothing moves: a plain empty
  // call, not a transfer.
  return { label: "Empty call" };
};
