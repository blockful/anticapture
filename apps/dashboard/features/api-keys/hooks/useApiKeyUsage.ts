"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchApiKeyUsage } from "@/shared/services/user-api/apiKeysClient";
import { UserApiRequestError } from "@/shared/services/user-api/request";

/** Fetches session-authenticated daily usage without running before sign-in. */
export const useApiKeyUsage = (userId: string | null) => {
  const query = useQuery({
    queryKey: ["user-api", "api-keys", "usage", userId],
    queryFn: async () => (await fetchApiKeyUsage()).items,
    enabled: userId !== null,
    refetchInterval: 60_000,
    retry: (failureCount, error) => {
      if (
        error instanceof UserApiRequestError &&
        (error.status === 404 || error.status === 401)
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    usage: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
