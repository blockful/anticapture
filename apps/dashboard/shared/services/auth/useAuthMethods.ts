"use client";

import { useQuery } from "@tanstack/react-query";

export type AuthMethods = {
  siwe: boolean;
  magicLink: boolean;
  google: boolean;
};

// Fail closed: on error only wallet sign-in is offered, so we never render a
// button whose endpoint the server doesn't serve.
const FALLBACK: AuthMethods = { siwe: true, magicLink: false, google: false };

/**
 * Which sign-in methods the User API deployment actually serves (magic link
 * and Google are env-gated server-side). The server is the source of truth so
 * the modal never offers a method that would 404.
 */
export const useAuthMethods = (enabled = true) => {
  const query = useQuery({
    queryKey: ["user-api", "auth-methods"],
    queryFn: async (): Promise<AuthMethods> => {
      const res = await fetch("/api/user/auth/methods");
      // Throw (don't resolve the fallback) so a transient 5xx — e.g. the
      // user-api mid-deploy — isn't cached as fresh "wallet-only" data for
      // the whole SPA session; the query stays refetchable and the
      // `query.data ?? FALLBACK` below keeps the UX fail-closed meanwhile.
      if (!res.ok) throw new Error(`auth methods responded ${res.status}`);
      return (await res.json()) as AuthMethods;
    },
    enabled,
    staleTime: Infinity,
    retry: 1,
  });

  return query.data ?? FALLBACK;
};
