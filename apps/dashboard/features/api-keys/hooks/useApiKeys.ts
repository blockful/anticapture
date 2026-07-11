"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type CreatedApiKey,
  type UserApiKey,
} from "@/shared/services/user-api/apiKeysClient";

const QUERY_KEY = ["user-api", "api-keys"] as const;

/**
 * API-key list + create/revoke against the User API (session-authenticated
 * via the /api/user proxy). `enabled` gates the fetch on an authenticated
 * session so we don't fire a guaranteed 401 before sign-in.
 */
export const useApiKeys = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await listApiKeys()).items,
    enabled,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = useMutation<CreatedApiKey, Error, string>({
    mutationFn: (label: string) => createApiKey(label),
    onSuccess: invalidate,
  });

  const revoke = useMutation<void, Error, string>({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: invalidate,
  });

  return {
    keys: (query.data ?? []) as UserApiKey[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create,
    revoke,
  };
};
