import type {
  DaoTokenItem,
  AvailableTokensPathParams,
} from "@anticapture/client";
import { useAvailableTokens } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export function useTokenList(daoId: DaoIdEnum) {
  const dao = daoId.toLowerCase() as AvailableTokensPathParams["dao"];

  const { data, isLoading } = useAvailableTokens(dao, {
    query: { enabled: Boolean(daoId) },
  });

  return {
    tokens: (data ?? []) as DaoTokenItem[],
    isLoading,
  };
}
