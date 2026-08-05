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
 *
 * `localStorage`, and neither of the two obvious alternatives. The URL is out
 * because a proposal body is far too big for a query string. `sessionStorage`
 * looked right for longer than it should have: it is per-tab, and the magic-link
 * sign-in mails an absolute URL back to this form, so following that link from a
 * mail client opens a NEW browsing context with an empty `sessionStorage`. The
 * author signed in successfully and landed on a blank form, their document gone
 * with nothing said. Surviving a sign-in that leaves the page is the entire job
 * here, and only cross-context storage does it.
 *
 * The cost is that any tab can drain the stash, not just the one that wrote it,
 * so it is bounded in time below and cleared on both consume and cancel. What is
 * deliberately accepted: two tabs importing for the same DAO share this key, and
 * the last write wins.
 *
 * Lowercased because the two sides read the route param with different casing,
 * and a mismatch fails silently.
 */
const keyFor = (daoId: string) =>
  `anticapture:pending-import:${daoId.toLowerCase()}`;

/*
 * How long a stash stays claimable. It has to outlive a mail round trip — open
 * the inbox, find the message, click it — without outliving the intent: now that
 * this survives tab closes, a stash with no expiry would fill a form in a later
 * session that nobody asked to fill, which is the failure this module keeps
 * circling back to.
 */
const MAX_AGE_MS = 60 * 60 * 1000;

/** Stored with the write time, since the reader is the one that has to decide
 *  the stash is too old to still be what the author meant. */
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
    localStorage.removeItem(keyFor(daoId));
  } catch {
    // Nothing to undo: a storage that refuses this refused the write too.
  }
};

/**
 * Reads the pending import and clears it, so a reload cannot re-apply an import
 * the author has since edited away.
 *
 * Refuses a stash older than `MAX_AGE_MS`, and clears whatever it found either
 * way: a record that is too old or malformed must not be reconsidered on the next
 * mount, or it would be re-refused for the life of the browser profile.
 */
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
