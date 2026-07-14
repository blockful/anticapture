// Hand-written client for the User API self-service API-keys surface
// (transport and error semantics live in ./request).
import { request } from "@/shared/services/user-api/request";

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

export const listApiKeys = () => request<{ items: UserApiKey[] }>(BASE);

export const createApiKey = (label: string) =>
  request<CreatedApiKey>(BASE, {
    method: "POST",
    body: JSON.stringify({ label }),
  });

export const revokeApiKey = (id: string) =>
  request<void>(`${BASE}/${id}`, { method: "DELETE" });
