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
 * `localStorage`, not `sessionStorage`: the magic link mails an absolute URL back to
 * the form, and following it from a mail client opens a new browsing context where a
 * per-tab stash is invisible. The cost is that any tab can drain it, so it expires
 * below and two tabs on a DAO share this key. Lowercased because the two sides read
 * the route param with different casing, and a mismatch fails silently.
 */
const keyFor = (daoId: string) =>
  `anticapture:pending-import:${daoId.toLowerCase()}`;

/** Long enough for a mail round trip, short enough not to fill a form in a later
 *  session that nobody asked to fill. */
const MAX_AGE_MS = 60 * 60 * 1000;

/** The write time travels with the values: the reader decides it is too old. */
type StoredHandoff = { at: number; values: ImportedProposal };

const isStoredHandoff = (value: unknown): value is StoredHandoff => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { at?: unknown; values?: unknown };
  return (
    typeof record.at === "number" &&
    typeof record.values === "object" &&
    record.values !== null
  );
};

/** False when storage is unavailable, so the caller can keep the author's
 *  document rather than navigate to a form that ignored it. */
export const stashImportedProposal = (
  daoId: string,
  values: ImportedProposal,
): boolean => {
  try {
    const record: StoredHandoff = { at: Date.now(), values };
    localStorage.setItem(keyFor(daoId), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
};

/** Drops a pending import unread, for a handoff whose navigation never happened.
 *  Left behind, the next visit to the form drains it into a blank proposal. */
export const clearImportedProposal = (daoId: string): void => {
  try {
    localStorage.removeItem(keyFor(daoId));
  } catch {
    // Nothing to undo: a storage that refuses this refused the write too.
  }
};

/** Reads the pending import and clears it, so a reload cannot re-apply one the
 *  author has since edited away. Clears even when refusing a stale or malformed
 *  record, which would otherwise be re-refused on every mount. */
export const takeImportedProposal = (
  daoId: string,
): ImportedProposal | null => {
  try {
    const raw = localStorage.getItem(keyFor(daoId));
    if (raw === null) return null;
    localStorage.removeItem(keyFor(daoId));
    const record: unknown = JSON.parse(raw);
    if (!isStoredHandoff(record)) return null;
    if (Date.now() - record.at > MAX_AGE_MS) return null;
    return record.values;
  } catch {
    return null;
  }
};
