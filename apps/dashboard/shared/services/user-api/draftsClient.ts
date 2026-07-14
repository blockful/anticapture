// Hand-written client for the User API drafts surface (transport and error
// semantics live in ./request).
import { request } from "@/shared/services/user-api/request";

const BASE = "/api/user/drafts";

export type UserApiDraft = {
  id: string;
  daoId: string;
  /** Author wallet, when known (SIWE authors). Null for email/Google authors. */
  authorAddress: string | null;
  title: string;
  discussionUrl: string;
  body: string;
  actions: Record<string, unknown>[];
  createdAt: number;
  updatedAt: number;
  /** Derived server-side from the session. */
  isOwner: boolean;
};

export type CreateDraftInput = {
  daoId: string;
  title: string;
  discussionUrl: string;
  body: string;
  actions: unknown[];
};

export type UpdateDraftInput = Partial<Omit<CreateDraftInput, "daoId">>;

export const listDrafts = (daoId: string) =>
  request<{ items: UserApiDraft[] }>(
    `${BASE}?daoId=${encodeURIComponent(daoId)}`,
  );

export const getDraft = (id: string) => request<UserApiDraft>(`${BASE}/${id}`);

export const createDraft = (input: CreateDraftInput) =>
  request<UserApiDraft>(BASE, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateDraft = (id: string, patch: UpdateDraftInput) =>
  request<UserApiDraft>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

export const deleteDraft = (id: string) =>
  request<void>(`${BASE}/${id}`, { method: "DELETE" });
