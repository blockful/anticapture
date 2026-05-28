"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDraftProposal,
  deleteDraftProposal,
  getDraftProposals,
  updateDraftProposal,
} from "@anticapture/client";
import type {
  DraftProposal,
  GetDraftProposalsPathParamsDaoEnumKey,
} from "@anticapture/client";
import { useAccount } from "wagmi";

import type {
  ProposalAction,
  ProposalDraft,
} from "@/features/create-proposal/types";
import { draftKey } from "@/features/create-proposal/utils/draftKey";
import {
  type NewDraftInput,
  readDrafts,
  removeDraft,
} from "@/features/create-proposal/utils/draftStorage";

export type UseDraftsReturn = {
  drafts: ProposalDraft[];
  saveDraft: (draft: NewDraftInput, id?: string) => Promise<string>;
  deleteDraft: (id: string) => Promise<void>;
  getDraft: (id: string) => ProposalDraft | undefined;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
};

const getStorage = (): Storage | undefined =>
  typeof window === "undefined" ? undefined : window.localStorage;

const toDraft = (d: DraftProposal): ProposalDraft => ({
  id: d.id,
  daoId: d.daoId,
  title: d.title,
  discussionUrl: d.discussionUrl,
  body: d.body,
  // API returns actions as unknown[] (open JSON objects); cast is intentional
  actions: d.actions as unknown as ProposalAction[],
  createdAt: Number(d.createdAt),
  updatedAt: Number(d.updatedAt),
});

export const useDrafts = (daoId: string): UseDraftsReturn => {
  const { address } = useAccount();
  const [drafts, setDrafts] = useState<ProposalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const migratedRef = useRef<Set<string>>(new Set());

  const dao = daoId as GetDraftProposalsPathParamsDaoEnumKey;

  const retry = useCallback(() => {
    setRetryToken((n) => n + 1);
  }, []);

  // Migrate localStorage drafts to API on first connect
  useEffect(() => {
    if (!address) return;
    // Capture address so stale in-flight responses from a previous address
    // cannot overwrite state after the user switches wallets.
    const capturedAddress = address;
    const key = `${daoId}:${capturedAddress}`;
    if (migratedRef.current.has(key)) return;

    let cancelled = false;

    const storage = getStorage();
    const localDrafts = storage
      ? readDrafts(storage, draftKey(daoId, capturedAddress))
      : [];

    const run = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const result = await getDraftProposals(dao, {
          address: capturedAddress,
        });
        if (cancelled) return;

        if (localDrafts.length === 0) {
          setDrafts(result.items.map(toDraft));
          // Only lock once the fetch has succeeded so transient failures can retry.
          migratedRef.current.add(key);
          return;
        }

        const remoteIds = new Set(result.items.map((d) => d.id));
        const newlyCreated = await Promise.all(
          localDrafts
            .filter((d) => !remoteIds.has(d.id))
            .map((d) =>
              createDraftProposal(dao, {
                id: d.id,
                address: capturedAddress,
                title: d.title,
                discussionUrl: d.discussionUrl,
                body: d.body,
                actions: d.actions,
              }),
            ),
        );

        if (cancelled) return;
        setDrafts([...result.items, ...newlyCreated].map(toDraft));

        if (storage) {
          storage.removeItem(draftKey(daoId, capturedAddress));
        }
        // Only lock the migration once it actually succeeded; otherwise a
        // transient API outage would strand the user until full remount.
        migratedRef.current.add(key);
      } catch {
        if (cancelled) return;
        // Migration failed — fall back to local drafts and surface an error so
        // the UI can offer a manual retry. The lock stays unset so a later
        // retry (via the `retry()` callback) can replay the migration.
        setDrafts(localDrafts);
        setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [daoId, dao, address, retryToken]);

  const saveDraft = useCallback(
    async (draft: NewDraftInput, id?: string): Promise<string> => {
      if (!address) return "";

      if (id) {
        const updated = await updateDraftProposal(dao, id, {
          address,
          title: draft.title,
          discussionUrl: draft.discussionUrl,
          body: draft.body,
          actions: draft.actions,
        });
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? toDraft(updated) : d)),
        );
        return id;
      }

      const newId = crypto.randomUUID();
      const created = await createDraftProposal(dao, {
        id: newId,
        address,
        title: draft.title,
        discussionUrl: draft.discussionUrl,
        body: draft.body,
        actions: draft.actions,
      });
      setDrafts((prev) => [toDraft(created), ...prev]);
      return created.id;
    },
    [dao, address],
  );

  const deleteDraft = useCallback(
    async (id: string): Promise<void> => {
      if (!address) return;
      await deleteDraftProposal(dao, id, { address });
      setDrafts((prev) => removeDraft(prev, id));
    },
    [dao, address],
  );

  const getDraft = useCallback(
    (id: string): ProposalDraft | undefined => drafts.find((d) => d.id === id),
    [drafts],
  );

  return { drafts, saveDraft, deleteDraft, getDraft, isLoading, error, retry };
};
