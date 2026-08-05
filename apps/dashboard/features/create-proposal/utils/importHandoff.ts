import type { ProposalFormValues } from "@/features/create-proposal/schema";

export type ImportedProposal = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: ProposalFormValues["actions"];
};

/* `localStorage`, not `sessionStorage`: the magic link mails an absolute URL back to
 * the form, and following it from a mail client opens a new browsing context where a
 * per-tab stash is invisible. The cost is the expiry below. Lowercased because the
 * two sides read the route param with different casing. */
const keyFor = (daoId: string) =>
  `anticapture:pending-import:${daoId.toLowerCase()}`;

const MAX_AGE_MS = 60 * 60 * 1000;

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

export const clearImportedProposal = (daoId: string): void => {
  try {
    localStorage.removeItem(keyFor(daoId));
  } catch {
    // Nothing to undo: storage that refuses this refused the write too.
  }
};

/** Reads and clears, so a reload cannot re-apply an import the author has since
 *  edited away. Clears even when refusing a stale record. */
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
