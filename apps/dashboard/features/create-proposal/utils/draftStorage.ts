import type { ProposalDraft } from "@/features/create-proposal/types";

export type NewDraftInput = Omit<
  ProposalDraft,
  "id" | "author" | "createdAt" | "updatedAt"
>;

export const readDrafts = (
  storage: Storage | undefined,
  key: string,
): ProposalDraft[] => {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProposalDraft[]) : [];
  } catch {
    return [];
  }
};

/** Rewrites a legacy-draft key; an empty list clears it. Best-effort. */
export const writeDrafts = (
  storage: Storage | undefined,
  key: string,
  drafts: ProposalDraft[],
): void => {
  if (!storage) return;
  try {
    if (drafts.length === 0) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(drafts));
  } catch {
    // quota/blocked storage keeps the previous value
  }
};

/** Drops browser rows that the authenticated user already owns server-side. */
export const excludePersistedDrafts = (
  localDrafts: ProposalDraft[],
  persistedDrafts: ProposalDraft[],
): ProposalDraft[] => {
  const persistedIds = new Set(persistedDrafts.map((draft) => draft.id));
  return localDrafts.filter((draft) => !persistedIds.has(draft.id));
};

export const removeDraft = (
  current: ProposalDraft[],
  id: string,
): ProposalDraft[] => {
  return current.filter((d) => d.id !== id);
};
