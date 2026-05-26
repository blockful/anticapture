import type { ProposalDraft } from "@/features/create-proposal/types";

export type NewDraftInput = Omit<
  ProposalDraft,
  "id" | "createdAt" | "updatedAt"
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

export const writeDrafts = (
  storage: Storage | undefined,
  key: string,
  drafts: ProposalDraft[],
): void => {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(drafts));
};

export const upsertDraft = (
  current: ProposalDraft[],
  input: NewDraftInput,
  now: number,
  generateId: () => string,
  id?: string,
): { next: ProposalDraft[]; savedId: string } => {
  const existing = id ? current.find((d) => d.id === id) : undefined;
  const savedId = existing?.id ?? generateId();
  const saved: ProposalDraft = existing
    ? { ...existing, ...input, updatedAt: now }
    : { ...input, id: savedId, createdAt: now, updatedAt: now };
  const next = existing
    ? current.map((d) => (d.id === existing.id ? saved : d))
    : [...current, saved];
  return { next, savedId };
};

export const removeDraft = (
  current: ProposalDraft[],
  id: string,
): ProposalDraft[] => {
  return current.filter((d) => d.id !== id);
};
