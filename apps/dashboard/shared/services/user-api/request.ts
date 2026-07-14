// Shared transport for the hand-written User API clients: same-origin
// /api/user proxy calls carrying the better-auth session cookie. The User API
// is not part of Gateful's OpenAPI, so it has no generated SDK.

export class UserApiRequestError extends Error {
  constructor(readonly status: number) {
    super(`user-api request failed with status ${status}`);
    this.name = "UserApiRequestError";
  }
}

export const request = async <T>(
  url: string,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new UserApiRequestError(res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};
