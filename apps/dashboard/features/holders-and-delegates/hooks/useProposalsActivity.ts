"use client";

import type {
  GetProposalsActivityQuery,
  GetProposalsActivityQueryVariables,
} from "@anticapture/graphql-client";
import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import { NetworkStatus } from "@apollo/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

type ProposalActivityItem = NonNullable<
  NonNullable<
    NonNullable<GetProposalsActivityQuery["proposalsActivity"]>["proposals"]
  >[number]
>;

interface UseProposalsActivityParams extends Partial<
  Omit<GetProposalsActivityQueryVariables, "address">
> {
  address: GetProposalsActivityQueryVariables["address"];
  limit: number;
  daoId: DaoIdEnum;
}

type ProposalActivityData = {
  totalProposals: number;
  votedProposals: number;
  neverVoted: number;
  winRate: number;
  yesRate: number;
  avgTimeBeforeEnd: number;
  proposals: ProposalActivityItem[];
};

interface UseProposalsActivityResult {
  data: ProposalActivityData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
  };
  fetchNextPage: () => void;
  fetchingMore: boolean;
}

export const useProposalsActivity = ({
  address,
  daoId,
  fromDate,
  skip,
  orderBy,
  orderDirection,
  userVoteFilter,
  limit,
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const [accumulatedProposals, setAccumulatedProposals] = useState<
    ProposalActivityItem[]
  >([]);

  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network" as const,
  };

  const [currentPage, setCurrentPage] = useState(1);
  const { data, networkStatus, error, refetch, fetchMore } =
    useGetProposalsActivityQuery({
      variables: {
        address,
        fromDate: fromDate ?? null,
        skip: skip ?? null,
        limit,
        orderBy: orderBy ?? null,
        orderDirection: orderDirection ?? null,
        userVoteFilter: userVoteFilter ?? null,
      },
      ...queryOptions,
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [address, daoId, fromDate, orderBy, orderDirection, userVoteFilter]);

  useEffect(() => {
    if (data?.proposalsActivity?.proposals) {
      if (currentPage === 1) {
        setAccumulatedProposals(
          (data.proposalsActivity.proposals ?? []).filter(
            Boolean,
          ) as ProposalActivityItem[],
        );
      }
    }
  }, [data?.proposalsActivity?.proposals, currentPage]);

  const totalProposals = data?.proposalsActivity?.totalProposals || 0;
  const totalPages = totalProposals ? Math.ceil(totalProposals / limit) : 1;
  const hasNextPage = currentPage < totalPages;

  // Pagination uses the accumulated state (currentPage) rather than the
  // initial skip variable, so infinite scroll works beyond the first page.
  const pagination = useMemo(() => {
    return {
      totalPages,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      currentPage,
    };
  }, [totalPages, hasNextPage, currentPage]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || networkStatus === NetworkStatus.fetchMore) return;
    try {
      await fetchMore({
        variables: {
          address,
          fromDate: fromDate ?? null,
          skip: accumulatedProposals.length,
          limit,
          orderBy: orderBy ?? null,
          orderDirection: orderDirection ?? null,
          userVoteFilter: userVoteFilter ?? null,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (
            !fetchMoreResult ||
            !prev.proposalsActivity ||
            !fetchMoreResult.proposalsActivity
          )
            return prev;
          const prevItems = prev.proposalsActivity.proposals ?? [];
          const newItems = fetchMoreResult.proposalsActivity.proposals ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) =>
                n &&
                !prevItems.some((p) => p?.proposal?.id === n?.proposal?.id),
            ),
          ].filter((item): item is ProposalActivityItem => item !== null);

          setAccumulatedProposals(merged);
          return {
            ...fetchMoreResult,
            proposalsActivity: {
              ...fetchMoreResult.proposalsActivity,
              proposals: merged,
            },
          };
        },
      });
      setCurrentPage((p) => p + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    }
  }, [
    fetchMore,
    hasNextPage,
    networkStatus,
    address,
    fromDate,
    limit,
    orderBy,
    orderDirection,
    userVoteFilter,
    accumulatedProposals.length,
  ]);

  const processedData: ProposalActivityData | null = useMemo(() => {
    if (!data?.proposalsActivity) return null;

    return {
      totalProposals: data.proposalsActivity.totalProposals,
      votedProposals: data.proposalsActivity.votedProposals,
      neverVoted: data.proposalsActivity.neverVoted ? 1 : 0,
      winRate: data.proposalsActivity.winRate,
      yesRate: data.proposalsActivity.yesRate,
      avgTimeBeforeEnd: data.proposalsActivity.avgTimeBeforeEnd,
      proposals: accumulatedProposals,
    };
  }, [data, accumulatedProposals]);

  const isLoading = useMemo(() => {
    return (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus]);

  return {
    data: processedData,
    loading: isLoading,
    error: error || null,
    refetch,
    pagination,
    fetchNextPage,
    fetchingMore: networkStatus === NetworkStatus.fetchMore,
  };
};
