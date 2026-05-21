import type { AvailableTokensPathParams } from "@anticapture/client";
import { useAvailableTokens } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useTokenList(daoId: DaoIdEnum) {
  const dao = daoId.toLowerCase() as AvailableTokensPathParams["dao"];

  const { data, isLoading, isError } = useAvailableTokens(dao, {
    query: { staleTime: ONE_HOUR_MS },
  });

  return {
    tokens: data ?? [],
    isLoading,
    isError,
  };
}
