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

/**
 * Drops a pending import without reading it, for a handoff whose navigation
 * never happened.
 *
 * The stash is written before the route is reached, because a sign-in can leave
 * the page entirely, so whoever staged it owns undoing it when the author turns
 * back. Left behind, it outlives the attempt: the next visit to the form in this
 * tab drains it, and an author who asked for a blank proposal gets the document
 * they walked away from.
 */
export const clearImportedProposal = (daoId: string): void => {
  try {
    sessionStorage.removeItem(keyFor(daoId));
  } catch {
    // Nothing to undo: a storage that refuses this refused the write too.
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
