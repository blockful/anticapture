// Hand-written client for the User API drafts surface, reached through the
// same-origin /api/user proxy with the better-auth session cookie. The User
// API is not part of Gateful's OpenAPI, so it has no generated SDK.

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

export class DraftsRequestError extends Error {
  constructor(readonly status: number) {
    super(`drafts request failed with status ${status}`);
    this.name = "DraftsRequestError";
  }
}

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new DraftsRequestError(res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};

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
