import type { DecodedParam } from "@/shared/services/decoder/types";

export type ArrayParamView = {
  /** Children to render right now. */
  visible: DecodedParam[];
  /** Elements kept by the decoder but folded away; only these can be shown. */
  folded: number;
  /** Everything off screen, counted against the array as it was encoded. */
  hidden: number;
  /** Length for the `type[n]` chip: what the calldata held, not what survived. */
  length: number;
  /** The "N more items not shown" note, when the budget dropped a tail. */
  note?: DecodedParam;
  /** Elements the decoder retained, the note excluded. */
  retained: number;
};

/**
 * How a decoded container renders. The decoder bounds a parameter tree with
 * one shared node budget and ends a truncated array with a synthetic "N more
 * items not shown" note, so the children are a sample of the array and never
 * the array itself. Every count here therefore comes from the encoded length
 * carried on the param: a 250-address argument must read `address[250]` and
 * offer 247 more entries, not `address[101]` and 98.
 *
 * `preview` is the number of elements shown while collapsed, or null to show
 * every child (an expanded array, or a tuple, which is never sliced).
 */
export const arrayParamView = (
  param: DecodedParam,
  preview: number | null,
): ArrayParamView => {
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
