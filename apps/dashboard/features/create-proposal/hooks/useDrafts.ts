"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProposalDraft } from "@/features/create-proposal/types";
import { draftKey } from "@/features/create-proposal/utils/draftKey";
import {
  type NewDraftInput,
  readDrafts,
  removeDraft,
  upsertDraft,
  writeDrafts,
} from "@/features/create-proposal/utils/draftStorage";

export type UseDraftsReturn = {
  drafts: ProposalDraft[];
  saveDraft: (draft: NewDraftInput, id?: string) => string;
  deleteDraft: (id: string) => void;
  getDraft: (id: string) => ProposalDraft | undefined;
};

const getStorage = (): Storage | undefined => {
  return typeof window === "undefined" ? undefined : window.localStorage;
};

export const useDrafts = (
  daoId: string,
  address: string | undefined,
): UseDraftsReturn => {
  const key = address ? draftKey(daoId, address) : null;
  const [drafts, setDrafts] = useState<ProposalDraft[]>(() =>
    key ? readDrafts(getStorage(), key) : [],
  );

  useEffect(() => {
    setDrafts(key ? readDrafts(getStorage(), key) : []);
  }, [key]);

  const saveDraft = useCallback(
    (draft: NewDraftInput, id?: string): string => {
      if (!key) return "";
      const storage = getStorage();
      const { next, savedId } = upsertDraft(
        readDrafts(storage, key),
        draft,
        Date.now(),
        () => crypto.randomUUID(),
        id,
      );
      writeDrafts(storage, key, next);
      setDrafts(next);
      return savedId;
    },
    [key],
  );

  const deleteDraft = useCallback(
    (id: string): void => {
      if (!key) return;
      const storage = getStorage();
      const next = removeDraft(readDrafts(storage, key), id);
      writeDrafts(storage, key, next);
      setDrafts(next);
    },
    [key],
  );

  const getDraft = useCallback(
    (id: string): ProposalDraft | undefined => drafts.find((d) => d.id === id),
    [drafts],
  );

  return { drafts, saveDraft, deleteDraft, getDraft };
};
