import type { DecodedParam } from "@/shared/services/decoder/types";

export type ContainerParamView = {
  /** Children to render right now. */
  visible: DecodedParam[];
  /** Children kept by the decoder but folded away; only these can be shown. */
  folded: number;
  /** Everything off screen, counted against the container as it was encoded. */
  hidden: number;
  /** Size for the `type[n]` chip and the field count: what the calldata held. */
  length: number;
  /** The "N more not shown" note, when the budget dropped a tail. */
  note?: DecodedParam;
  /** Children the decoder retained, the note excluded. */
  retained: number;
};

/**
 * How a decoded array or tuple renders. The decoder bounds a parameter tree
 * with one shared node budget and ends a truncated container with a synthetic
 * "N more not shown" note, so the children are a sample of the container and
 * never the container itself. Every count here therefore comes from the
 * encoded length carried on the param: a 250-address argument must read
 * `address[250]` and offer 247 more entries, not `address[101]` and 98.
 *
 * `preview` is the number of children shown while collapsed, or null to show
 * every one (an expanded array, or a tuple, which is never sliced).
 */
export const containerParamView = (
  param: DecodedParam,
  preview: number | null,
): ContainerParamView => {
  const children = param.children ?? [];
  const note = children.find((child) => child.isTruncationNote);
  const elements = note
    ? children.filter((child) => !child.isTruncationNote)
    : children;
  const visible = preview === null ? elements : elements.slice(0, preview);
  const length = param.originalLength ?? elements.length;
  return {
    visible,
    note,
    length,
    retained: elements.length,
    folded: elements.length - visible.length,
    hidden: length - visible.length,
  };
};
