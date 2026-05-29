import {
  getNextPageParam,
  type OffchainProposalsPathParamsDaoEnumKey,
  type OffchainProposalsQueryParams,
  type OffchainProposalsQueryResponse,
  type OrderDirection,
} from "@anticapture/client";
import { useOffchainProposalsInfinite } from "@anticapture/client/hooks";
import { useCallback, useMemo } from "react";

import type { PaginationInfo } from "@/features/governance/hooks/useProposals";
import type { DaoIdEnum } from "@/shared/types/daos";

export type OffchainProposalItem =
  OffchainProposalsQueryResponse["items"][number];

export interface UseOffchainProposalsResult {
  proposals: OffchainProposalItem[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  isPaginationLoading: boolean;
}

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
}: UseOffchainProposalsParams = {}): UseOffchainProposalsResult => {
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

  const pagination: PaginationInfo = useMemo(() => {
    const currentItemsCount = proposals.length;
    const currentPage = Math.ceil(currentItemsCount / itemsPerPage);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: Boolean(hasNextPage),
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [proposals.length, totalCount, itemsPerPage, hasNextPage]);

  const handleFetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    proposals,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    pagination,
    fetchNextPage: handleFetchNextPage,
    isPaginationLoading: isFetchingNextPage,
  };
};
