// Hand-written client for the User API self-service API-keys surface, reached
// through the same-origin /api/user proxy with the better-auth session cookie.
// The User API is not part of Gateful's OpenAPI, so it has no generated SDK.

const BASE = "/api/user/me/api-keys";

export type UserApiKey = {
  id: string;
  label: string;
  createdAt: string;
  revokedAt: string | null;
  /** From Authful; null when never used or Authful was unreachable. */
  lastUsedAt: string | null;
};

/** Create returns the plaintext exactly once — never retrievable again. */
export type CreatedApiKey = UserApiKey & { token: string };

export class ApiKeysRequestError extends Error {
  constructor(readonly status: number) {
    super(`api-keys request failed with status ${status}`);
    this.name = "ApiKeysRequestError";
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
  if (!res.ok) throw new ApiKeysRequestError(res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};

export const listApiKeys = () => request<{ items: UserApiKey[] }>(BASE);

export const createApiKey = (label: string) =>
  request<CreatedApiKey>(BASE, {
    method: "POST",
    body: JSON.stringify({ label }),
  });

export const revokeApiKey = (id: string) =>
  request<void>(`${BASE}/${id}`, { method: "DELETE" });
