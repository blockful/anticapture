import {
  getNextPageParam,
  type OffchainProposalsPathParamsDaoEnumKey,
  type OffchainProposalsQueryParams,
  type OffchainProposalsQueryResponse,
  type OrderDirection,
} from "@anticapture/client";
import { useOffchainProposalsInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

export type OffchainProposalItem =
  OffchainProposalsQueryResponse["items"][number];

export interface UseOffchainProposalsParams {
  fromDate?: number | null;
  orderDirection?: OrderDirection;
  status?: OffchainProposalsQueryParams["status"];
  itemsPerPage?: number;
  daoId?: DaoIdEnum;
}

export const useOffchainProposals = ({
  fromDate,
  orderDirection = "desc",
  status,
  itemsPerPage = 10,
  daoId,
}: UseOffchainProposalsParams = {}) => {
  const queryParams = useMemo<OffchainProposalsQueryParams>(
    () => ({
      limit: itemsPerPage,
      orderDirection,
      status: status ?? undefined,
      fromDate: fromDate ?? undefined,
    }),
    [itemsPerPage, orderDirection, status, fromDate],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOffchainProposalsInfinite(
    daoId?.toLowerCase() as OffchainProposalsPathParamsDaoEnumKey,
    queryParams,
    { query: { enabled: !!daoId, getNextPageParam } },
  );

  const proposals = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    proposals,
    loading: isLoading,
    error,
    pagination: {
      hasNextPage: Boolean(hasNextPage),
      totalCount,
      currentPage: Math.ceil(proposals.length / itemsPerPage),
      totalPages: Math.ceil(totalCount / itemsPerPage),
      itemsPerPage,
    },
    fetchNextPage,
    isPaginationLoading: isFetchingNextPage,
  };
};
