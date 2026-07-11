"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  ProposalAction,
  ProposalDraft,
} from "@/features/create-proposal/types";
import { type NewDraftInput } from "@/features/create-proposal/utils/draftStorage";
import { useSession } from "@/shared/services/auth/client";
import {
  createDraft,
  deleteDraft as deleteDraftRequest,
  DraftsRequestError,
  listDrafts,
  updateDraft,
  type UserApiDraft,
} from "@/shared/services/user-api/draftsClient";

export type UseDraftsReturn = {
  drafts: ProposalDraft[];
  saveDraft: (draft: NewDraftInput, id?: string) => Promise<string>;
  deleteDraft: (id: string) => Promise<void>;
  getDraft: (id: string) => ProposalDraft | undefined;
  isLoading: boolean;
  error: boolean;
  /** True when there is no session — the caller should prompt sign-in. */
  needsAuth: boolean;
  retry: () => void;
};

const toDraft = (d: UserApiDraft): ProposalDraft => ({
  id: d.id,
  daoId: d.daoId,
  author: d.authorAddress ?? "",
  title: d.title,
  discussionUrl: d.discussionUrl,
  body: d.body,
  actions: d.actions as unknown as ProposalAction[],
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export const useDrafts = (daoId: string): UseDraftsReturn => {
  const { data: session, isPending: isSessionPending } = useSession();
  const [drafts, setDrafts] = useState<ProposalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const userId = session?.user.id ?? null;
  const needsAuth = !isSessionPending && !userId;

  const retry = useCallback(() => setRetryToken((n) => n + 1), []);

  // Drafts are session-scoped: load them once authenticated. Identity comes
  // from the session cookie, never a request param. Legacy drafts created
  // before accounts are migrated server-side (DAO DB -> User DB, claimed on
  // first SIWE login), so there is nothing to migrate from the browser here.
  useEffect(() => {
    if (!userId) {
      setDrafts([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const { items } = await listDrafts(daoId);
        if (!cancelled) setDrafts(items.map(toDraft));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [daoId, userId, retryToken]);

  const saveDraft = useCallback(
    async (draft: NewDraftInput, id?: string): Promise<string> => {
      if (!userId) return "";

      if (id) {
        const updated = await updateDraft(id, {
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

      const created = await createDraft({
        daoId,
        title: draft.title,
        discussionUrl: draft.discussionUrl,
        body: draft.body,
        actions: draft.actions,
      });
      setDrafts((prev) => [toDraft(created), ...prev]);
      return created.id;
    },
    [daoId, userId],
  );

  const deleteDraft = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return;
      try {
        await deleteDraftRequest(id);
      } catch (err) {
        // A missing/foreign row is already gone from the user's perspective.
        const notFound =
          err instanceof DraftsRequestError && err.status === 404;
        if (!notFound) throw err;
      }
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    },
    [userId],
  );

  const getDraft = useCallback(
    (id: string): ProposalDraft | undefined => drafts.find((d) => d.id === id),
    [drafts],
  );

  return {
    drafts,
    saveDraft,
    deleteDraft,
    getDraft,
    isLoading,
    error,
    needsAuth,
    retry,
  };
};
