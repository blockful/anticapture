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

export const removeDraft = (
  current: ProposalDraft[],
  id: string,
): ProposalDraft[] => {
  return current.filter((d) => d.id !== id);
};
