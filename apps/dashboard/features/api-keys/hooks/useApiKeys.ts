"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type CreatedApiKey,
} from "@/shared/services/user-api/apiKeysClient";
import { UserApiRequestError } from "@/shared/services/user-api/request";

/**
 * API-key list + create/revoke against the User API (session-authenticated
 * via the /api/user proxy). The query is keyed by the session user, so one
 * account's keys are never served from another account's cache, and nothing
 * fetches before sign-in.
 */
export const useApiKeys = (userId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ["user-api", "api-keys", userId] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => (await listApiKeys()).items,
    enabled: userId !== null,
    retry: (failureCount, error) => {
      // 404 = the deployment doesn't serve API keys (no Authful provisioning
      // configured); 401 = session vanished. Neither heals by retrying.
      if (
        error instanceof UserApiRequestError &&
        (error.status === 404 || error.status === 401)
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["user-api", "api-keys"] });

  const create = useMutation<CreatedApiKey, Error, string>({
    mutationFn: (label: string) => createApiKey(label),
    onSuccess: invalidate,
  });

  const revoke = useMutation<void, Error, string>({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: invalidate,
  });

  const isUnavailable =
    query.error instanceof UserApiRequestError && query.error.status === 404;

  return {
    keys: query.data ?? [],
    isLoading: query.isLoading,
    /** The deployment doesn't serve the API-key surface at all. */
    isUnavailable,
    isError: query.isError && !isUnavailable,
    refetch: query.refetch,
    create,
    revoke,
  };
};
