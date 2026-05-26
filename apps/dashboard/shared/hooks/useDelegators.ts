import {
  getNextPageParam,
  type DelegatorsPathParamsDaoEnumKey,
  type DelegatorsQueryParamsOrderByEnumKey,
  type OrderDirection,
} from "@anticapture/client";
import { useDelegatorsInfinite } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

interface UseVotingPowerParams {
  daoId: DaoIdEnum;
  address: string;
  orderBy?: DelegatorsQueryParamsOrderByEnumKey;
  orderDirection?: OrderDirection;
  limit?: number;
}

export const useDelegators = ({
  daoId,
  address,
  orderBy = "amount",
  orderDirection = "desc",
  limit = 15,
}: UseVotingPowerParams) => {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDelegatorsInfinite(
    daoId.toLowerCase() as DelegatorsPathParamsDaoEnumKey,
    address,
    {
      orderBy,
      orderDirection,
      limit,
    },
    { query: { getNextPageParam } },
  );

  return {
    delegators: data?.pages.flatMap((p) => p.items) ?? [],
    loading: isLoading,
    error: error || null,
    refetch,
    hasNextPage,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
    totalCount: data?.pages[0]?.totalCount || 0,
  };
};
