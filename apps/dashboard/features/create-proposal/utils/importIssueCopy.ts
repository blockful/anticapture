import {
  formatImportIssue,
  type ImportIssue,
} from "@/features/create-proposal/utils/parseProposalJson";

/**
 * The one-line summary the import modal's status row shows.
 *
 * Two constraints shape it. It has to fit on one line under the textarea, and it
 * has to say enough to act on without scrolling the document, which in practice
 * means a line number and the offending value, in that order, because the line
 * is how you get there and the value is how you recognize it.
 */

/**
 * `unquoted number 480000 must be quoted`, when the literal is known.
 *
 * The generic message explains *why* quoting matters, which is the right thing
 * to say next to the field and the wrong thing to say in a status row: it costs a
 * whole line and never names the figure. The literal comes from the raw text, so
 * it is what the author typed even when the parsed double no longer is.
 */
const summarize = (issue: ImportIssue): string => {
  if (issue.numberLiteral) {
    return `unquoted number ${issue.numberLiteral} must be quoted`;
  }
  return formatImportIssue(issue);
};

/** `Line 7 · …`, dropping the prefix when the line isn't known. */
const withLine = (issue: ImportIssue, body: string): string =>
  issue.line ? `Line ${issue.line} · ${body}` : body;

/**
 * Valid: `Valid · 3 actions`.
 *
 * Only the action count, because it is the one thing a reader can check against
 * their own document at a glance.
 */
export const describeValidImport = (
  actionCount: number | undefined,
): string => {
  if (actionCount === undefined) return "Valid";
  return `Valid · ${actionCount} action${actionCount === 1 ? "" : "s"}`;
};

/**
 * One problem: `Line 7 · unquoted number 480000 must be quoted`.
 * Several: `3 problems · first on line 7 · unquoted number 480000`.
 *
 * The plural form leads with the count so the reader knows fixing one line won't
 * be the end of it, and still names the first one so there is somewhere to start.
 */
export const describeImportIssues = (
  issues: readonly ImportIssue[],
): string => {
  const [first] = issues;
  if (!first) return "";

  if (issues.length === 1) return withLine(first, summarize(first));

  const where = first.line ? ` · first on line ${first.line}` : "";
  // The trailing clause names the value, not the full sentence: the count and
  // the line already carry the rest, and this has to stay on one line.
  const what = first.numberLiteral
    ? ` · unquoted number ${first.numberLiteral}`
    : ` · ${summarize(first)}`;
  return `${issues.length} problems${where}${what}`;
};
