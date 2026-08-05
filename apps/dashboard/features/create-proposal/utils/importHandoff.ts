import type { ProposalFormValues } from "@/features/create-proposal/schema";

/**
 * The values an import hands to the creation form.
 *
 * Everything is optional for the same reason the document's fields are: an import
 * fills what it carries and leaves the rest of the form alone.
 */
export type ImportedProposal = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: ProposalFormValues["actions"];
};

/**
 * The import runs on the proposals list and the form it fills lives on another
 * route, so the values have to survive a navigation. They go through
 * sessionStorage rather than the URL: a proposal body is far too big for a query
 * string, and the sign-in gate can leave the page entirely on the way, which
 * in-memory state would not survive. The pending-draft stash the form already
 * keeps for the auth round trip works the same way.
 *
 * Scoped per DAO so an import prepared for one can never land on another's form.
 *
 * The id is lowercased here rather than at the call sites. A route param carries
 * whatever case the URL was typed with, so `/ENS/proposals` would otherwise stash
 * under `ENS` while the form, reached through the normalized lowercase route,
 * looks under `ens` and finds nothing. That failure is silent: the import
 * succeeds and the author still lands on an empty form. Normalizing in the one
 * place both sides go through keeps them in agreement whatever a caller passes.
 */
const keyFor = (daoId: string) =>
  `anticapture:pending-import:${daoId.toLowerCase()}`;

/** Returns false when storage is unavailable, so the caller can say so. */
export const stashImportedProposal = (
  daoId: string,
  values: ImportedProposal,
): boolean => {
  try {
    sessionStorage.setItem(keyFor(daoId), JSON.stringify(values));
    return true;
  } catch {
    // Storage can be blocked or full. Better to keep the user in the dialog with
    // their document than to navigate to a form that silently ignored it.
    return false;
  }
};

/**
 * Reads the pending import and clears it in the same breath.
 *
 * Clearing on read is what stops a reload, or a second visit to the form, from
 * quietly re-applying an import the author has since edited away.
 */
export const takeImportedProposal = (
  daoId: string,
): ImportedProposal | null => {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(keyFor(daoId));
    if (raw !== null) sessionStorage.removeItem(keyFor(daoId));
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImportedProposal;
  } catch {
    // Corrupted stash. Dropping it is right: it was already removed above, so a
    // reload starts clean rather than failing the same way again.
    return null;
  }
};
