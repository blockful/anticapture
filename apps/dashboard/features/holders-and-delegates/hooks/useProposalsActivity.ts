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
}: UseProposalsActivityParams) => {
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

  const processedData = useMemo((): ProposalActivityResponse | null => {
    if (!data?.pages?.length) return null;
    const firstPage = data.pages[0];
    const seen = new Set<string>();
    const proposals = data.pages
      .flatMap((p) => p.proposals)
      .filter((item) => {
        const id = item.proposal.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    return { ...firstPage, proposals };
  }, [data]);

  return {
    data: processedData,
    loading: isLoading,
    error: error ?? null,
    hasNextPage,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
  };
};
