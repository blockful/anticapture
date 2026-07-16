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
  writeDrafts,
  type NewDraftInput,
} from "@/features/create-proposal/utils/draftStorage";
import { useSession } from "@/shared/services/auth/client";
import {
  createDraft,
  deleteDraft as deleteDraftRequest,
  listDrafts,
  updateDraft,
  type UserApiDraft,
} from "@/shared/services/user-api/draftsClient";
import { UserApiRequestError } from "@/shared/services/user-api/request";

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
  // from the session cookie, never a request param — so the fetch is keyed by
  // the session user only, and a wallet connect/disconnect never clears or
  // refetches the list.
  useEffect(() => {
    // Reset immediately so one user's drafts (or a previous session's) never
    // linger on screen while another session's fetch is in flight. A fetch
    // cancelled by this effect's cleanup skips its finally, so the flags are
    // cleared here too — sign-out mid-request must not strand isLoading.
    setDrafts([]);
    if (!userId) {
      setIsLoading(false);
      setError(false);
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

  // Legacy drafts created before accounts existed had two homes: the DAO DB
  // (migrated server-side, claimed on first SIWE login) and this browser's
  // localStorage — drained here once per dao:wallet on an authenticated load.
  // Server ids are authoritative now, so local rows upload (concurrently) as
  // new drafts. The key is cleared only after every upload succeeded — a
  // failure surfaces the error state and leaves the key for the retry, which
  // re-runs this effect via retryToken. A successful drain also bumps
  // retryToken so the list refetches with the drained rows included.
  useEffect(() => {
    if (!userId || !address) return;
    const localKey = `${daoId}:${address.toLowerCase()}`;
    if (drainedLocalRef.current.has(localKey)) return;
    const storage =
      typeof window === "undefined" ? undefined : window.localStorage;
    if (!storage) return;

    const localDrafts = readDrafts(storage, draftKey(daoId, address));
    if (localDrafts.length === 0) {
      drainedLocalRef.current.add(localKey);
      return;
    }

    let cancelled = false;
    const run = async () => {
      // Per-row idempotency: rows that upload successfully are removed from
      // the key right away, so a partial failure retries only the failed
      // rows instead of duplicating the migrated ones on the next attempt.
      const results = await Promise.allSettled(
        localDrafts.map((d) =>
          createDraft({
            daoId,
            title: d.title,
            discussionUrl: d.discussionUrl,
            body: d.body,
            actions: d.actions,
          }),
        ),
      );
      const failed = localDrafts.filter(
        (_, i) => results[i]?.status === "rejected",
      );
      writeDrafts(storage, draftKey(daoId, address), failed);
      if (failed.length === 0) {
        drainedLocalRef.current.add(localKey);
        if (!cancelled) setRetryToken((n) => n + 1);
      } else if (!cancelled) {
        setError(true);
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
          err instanceof UserApiRequestError && err.status === 404;
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
