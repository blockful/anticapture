import {
  getNextPageParam,
  orderDirectionEnum,
  type OffchainProposal,
  type OffchainProposalsPathParams,
  type OffchainProposalsQueryParams,
  type ResponseErrorConfig,
} from "@anticapture/client";
import { useOffchainProposalsInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseOffchainProposalsResult {
  data: OffchainProposal[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  error: ResponseErrorConfig | null;
}

export interface UseOffchainProposalsParams extends Omit<
  OffchainProposalsQueryParams,
  "skip" | "limit"
> {
  itemsPerPage?: number;
  daoId?: DaoIdEnum;
}

export const useOffchainProposals = ({
  fromDate,
  orderDirection = orderDirectionEnum.desc,
  status,
  itemsPerPage = 10,
  daoId,
}: UseOffchainProposalsParams = {}): UseOffchainProposalsResult => {
  const queryParams = useMemo<OffchainProposalsQueryParams>(
    () => ({
      limit: itemsPerPage,
      orderDirection,
      status,
      fromDate,
    }),
    [itemsPerPage, orderDirection, status, fromDate],
  );

  const query = useOffchainProposalsInfinite(
    daoId?.toLowerCase() as OffchainProposalsPathParams["dao"],
    queryParams,
    {
      query: {
        getNextPageParam,
        enabled: !!daoId,
      },
    },
  );

  const data = useMemo<OffchainProposal[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error ?? null,
  };
};
