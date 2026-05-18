import {
  getNextPageParam,
  orderDirectionEnum,
  type ProposalsPathParams,
  type ProposalsQueryParams,
  type ResponseErrorConfig,
} from "@anticapture/client";
import { useProposalsInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface PaginationInfo {
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

export interface UseProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: ResponseErrorConfig<Error> | null;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<unknown>;
  isPaginationLoading: boolean;
}

export interface UseProposalsParams extends Omit<
  ProposalsQueryParams,
  "skip" | "limit" | "fromDate" | "fromEndDate" | "status"
> {
  itemsPerPage?: number;
  daoId?: DaoIdEnum;
  fromDate?: number | null;
  fromEndDate?: number | null;
  status?: ProposalsQueryParams["status"] | null;
}

export const useProposals = (
  {
    fromDate = null,
    orderDirection = orderDirectionEnum.desc,
    status = null,
    fromEndDate: _fromEndDate = null,
    includeOptimisticProposals = null,
    itemsPerPage = 10,
    daoId,
  }: UseProposalsParams = {
    fromDate: null,
    status: null,
    fromEndDate: null,
    includeOptimisticProposals: null,
  },
): UseProposalsResult => {
  const { decimals } = daoConfig[daoId as DaoIdEnum];

  const queryParams = useMemo<ProposalsQueryParams>(
    () => ({
      limit: itemsPerPage,
      orderDirection,
      status: status ?? undefined,
      fromDate: fromDate ?? undefined,
      fromEndDate: _fromEndDate ?? undefined,
      includeOptimisticProposals,
    }),
    [
      itemsPerPage,
      orderDirection,
      status,
      fromDate,
      _fromEndDate,
      includeOptimisticProposals,
    ],
  );

  const query = useProposalsInfinite(
    daoId?.toLowerCase() as ProposalsPathParams["dao"],
    queryParams,
    {
      query: {
        getNextPageParam,
        enabled: !!daoId,
      },
    },
  );

  const proposals = useMemo<GovernanceProposal[]>(
    () =>
      query.data?.pages
        .flatMap((page) => page.items)
        .map((proposal) => transformToGovernanceProposal(proposal, decimals)) ??
      [],
    [query.data, decimals],
  );

  const pagination: PaginationInfo = useMemo(() => {
    const totalCount = query.data?.pages.at(-1)?.totalCount || 0;
    const currentItemsCount = proposals.length;
    const hasNextPage = currentItemsCount < totalCount;
    const currentPage = Math.ceil(currentItemsCount / itemsPerPage);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [query.data, proposals.length, itemsPerPage]);

  return {
    proposals,
    loading: query.isLoading,
    error: query.error ?? null,
    pagination,
    fetchNextPage: query.fetchNextPage,
    isPaginationLoading: query.isFetchingNextPage,
  };
};
