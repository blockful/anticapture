import type { ProposalFormValues } from "@/features/create-proposal/schema";

/** What an import hands to the creation form. All optional: an import fills what
 *  it carries and leaves the rest of the form alone. */
export type ImportedProposal = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: ProposalFormValues["actions"];
};

/*
 * The import runs on the proposals list and fills a form on another route, so the
 * values cross a navigation and sometimes a sign-in that leaves the page.
 * sessionStorage rather than the URL, since a proposal body is far too big for a
 * query string. Lowercased because the two sides read the route param with
 * different casing, and a mismatch fails silently.
 */
const keyFor = (daoId: string) =>
  `anticapture:pending-import:${daoId.toLowerCase()}`;

/** False when storage is unavailable, so the caller can keep the author's
 *  document rather than navigate to a form that ignored it. */
export const stashImportedProposal = (
  daoId: string,
  values: ImportedProposal,
): boolean => {
  try {
    sessionStorage.setItem(keyFor(daoId), JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
};

/** Reads the pending import and clears it, so a reload cannot re-apply an import
 *  the author has since edited away. */
export const takeImportedProposal = (
  daoId: string,
): ImportedProposal | null => {
  try {
    const raw = sessionStorage.getItem(keyFor(daoId));
    if (raw === null) return null;
    sessionStorage.removeItem(keyFor(daoId));
    return JSON.parse(raw) as ImportedProposal;
  } catch {
    return null;
  }
};
