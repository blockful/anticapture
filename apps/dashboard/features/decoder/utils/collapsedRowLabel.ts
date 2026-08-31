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
  const hasSelector = Boolean(calldata && /^0x[0-9a-fA-F]{8}/.test(calldata));
  const withValue = (label: string): string =>
    hasSelector && value !== undefined && value > 0n
      ? `${label} · sends ${humanizeEtherValue(value).text}`
      : label;

  if (decoded?.summary) {
    return { label: withValue(decoded.summary), signature: decoded.signature };
  }
  if (decoded?.signature) {
    return { label: withValue(decoded.signature) };
  }
  if (hasSelector && calldata) {
    return { label: withValue(`selector ${calldata.slice(0, 10)}`) };
  }
  // Empty calldata with attached value summarizes as an ETH transfer above;
  // reaching here means no summary exists, so nothing moves: a plain empty
  // call, not a transfer.
  return { label: "Empty call" };
};
