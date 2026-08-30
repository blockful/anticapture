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
 * decode is still in flight.
 */
export const buildCollapsedRowLabel = (
  decoded: CollapsedDecode | undefined,
  calldata: string | null,
): CollapsedLabel => {
  if (decoded?.summary) {
    return { label: decoded.summary, signature: decoded.signature };
  }
  if (decoded?.signature) {
    return { label: decoded.signature };
  }
  if (calldata && /^0x[0-9a-fA-F]{8}/.test(calldata)) {
    return { label: `selector ${calldata.slice(0, 10)}` };
  }
  return { label: "ETH transfer" };
};
