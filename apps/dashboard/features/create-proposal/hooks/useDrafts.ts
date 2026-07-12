"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

import type {
  ProposalAction,
  ProposalDraft,
} from "@/features/create-proposal/types";
import { draftKey } from "@/features/create-proposal/utils/draftKey";
import {
  readDrafts,
  type NewDraftInput,
} from "@/features/create-proposal/utils/draftStorage";
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
  const { address } = useAccount();
  const [drafts, setDrafts] = useState<ProposalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  // Browser-local upload runs once per dao:address (see below).
  const drainedLocalRef = useRef<Set<string>>(new Set());

  const userId = session?.user.id ?? null;
  const needsAuth = !isSessionPending && !userId;

  const retry = useCallback(() => setRetryToken((n) => n + 1), []);

  // Drafts are session-scoped: load them once authenticated. Identity comes
  // from the session cookie, never a request param. Legacy drafts created
  // before accounts existed had two homes: the DAO DB (migrated server-side,
  // claimed on first SIWE login) and this browser's localStorage — those are
  // drained here on the first authenticated load, then the key is removed.
  useEffect(() => {
    // Reset immediately so one user's drafts (or a previous session's) never
    // linger on screen while another session's fetch is in flight.
    setDrafts([]);
    if (!userId) return;

    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const wallet = address ?? null;
        const localKey = wallet ? `${daoId}:${wallet.toLowerCase()}` : null;
        const storage =
          typeof window === "undefined" ? undefined : window.localStorage;
        const localDrafts =
          wallet &&
          localKey &&
          storage &&
          !drainedLocalRef.current.has(localKey)
            ? readDrafts(storage, draftKey(daoId, wallet))
            : [];

        // Server ids are authoritative now, so local rows upload as new
        // drafts. The key is cleared only after every upload succeeded;
        // a failure leaves it for the next attempt.
        for (const d of localDrafts) {
          await createDraft({
            daoId,
            title: d.title,
            discussionUrl: d.discussionUrl,
            body: d.body,
            actions: d.actions,
          });
        }
        if (wallet && storage && localDrafts.length > 0) {
          storage.removeItem(draftKey(daoId, wallet));
        }
        if (localKey) drainedLocalRef.current.add(localKey);

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
  }, [daoId, userId, address, retryToken]);

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
