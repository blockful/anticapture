"use client";

import type {
  ProposalActivityResponse,
  ProposalsActivityPathParamsDaoEnumKey,
  ProposalsActivityQueryParams,
  ProposalsActivityQueryParamsOrderByEnumKey,
  ProposalsActivityQueryParamsUserVoteFilterEnumKey,
} from "@anticapture/client";
import { useProposalsActivityInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

interface UseProposalsActivityParams {
  address: string;
  daoId: DaoIdEnum;
  fromDate?: number;
  orderBy?: ProposalsActivityQueryParamsOrderByEnumKey;
  orderDirection?: "asc" | "desc";
  userVoteFilter?: ProposalsActivityQueryParamsUserVoteFilterEnumKey | null;
  limit: number;
}

type ProposalActivityData = Pick<
  ProposalActivityResponse,
  | "totalProposals"
  | "votedProposals"
  | "winRate"
  | "yesRate"
  | "avgTimeBeforeEnd"
  | "proposals"
> & {
  neverVoted: number;
};

interface UseProposalsActivityResult {
  data: ProposalActivityData | null;
  loading: boolean;
  error: Error | null;
  pagination: {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
  };
  fetchNextPage: () => void;
  fetchingMore: boolean;
}

const getProposalsNextPage = (
  _lastPage: ProposalActivityResponse,
  allPages: ProposalActivityResponse[],
): number | undefined => {
  const loaded = allPages.reduce((s, p) => s + p.proposals.length, 0);
  const total = allPages[0]?.totalProposals ?? 0;
  return loaded >= total ? undefined : loaded;
};

export const useProposalsActivity = ({
  address,
  daoId,
  fromDate,
  orderBy,
  orderDirection,
  userVoteFilter,
  limit,
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const params = useMemo<ProposalsActivityQueryParams>(
    () => ({
      address,
      limit,
      ...(fromDate ? { fromDate } : {}),
      ...(orderBy ? { orderBy } : {}),
      ...(orderDirection ? { orderDirection } : {}),
      ...(userVoteFilter ? { userVoteFilter } : {}),
    }),
    [address, limit, fromDate, orderBy, orderDirection, userVoteFilter],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProposalsActivityInfinite(
    daoId.toLowerCase() as ProposalsActivityPathParamsDaoEnumKey,
    params,
    { query: { getNextPageParam: getProposalsNextPage } },
  );

  const processedData = useMemo((): ProposalActivityData | null => {
    if (!data?.pages?.length) return null;
    const firstPage = data.pages[0];
    const proposals = data.pages.flatMap((p) => p.proposals);
    return {
      totalProposals: firstPage.totalProposals,
      votedProposals: firstPage.votedProposals,
      neverVoted: firstPage.neverVoted ? 1 : 0,
      winRate: firstPage.winRate,
      yesRate: firstPage.yesRate,
      avgTimeBeforeEnd: firstPage.avgTimeBeforeEnd,
      proposals,
    };
  }, [data]);

  const totalProposals = processedData?.totalProposals ?? 0;
  const currentPage = data?.pages?.length ?? 0;
  const totalPages = totalProposals ? Math.ceil(totalProposals / limit) : 1;

  const pagination = useMemo(
    () => ({
      totalPages,
      hasNextPage: hasNextPage ?? false,
      hasPreviousPage: currentPage > 1,
      currentPage,
    }),
    [totalPages, hasNextPage, currentPage],
  );

  return {
    data: processedData,
    loading: isLoading,
    error: error ?? null,
    pagination,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
  };
};
