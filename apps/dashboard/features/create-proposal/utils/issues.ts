/**
 * One thing wrong, and where.
 *
 * Every pass over a proposal reports in this shape — the argument validator, the
 * custom-action rules, the JSON translation, the import dialog — and they used to
 * declare it four separate times under four names, each with its own path
 * formatter. The paths compose, which is the whole reason it is one type: an arg
 * issue at `durations.total` is re-rooted at `args[0].durations.total` by the
 * action, and at `actions[2].args[0].durations.total` by the document.
 *
 * A path segment is a string for an object key or a named tuple component, and a
 * number for an array index — the same convention zod's own issue paths use, so
 * the two can be mixed without translating between them.
 */
export type Issue = {
  path: (string | number)[];
  message: string;
};
