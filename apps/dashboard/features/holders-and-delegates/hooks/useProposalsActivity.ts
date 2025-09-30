import { useCallback, useEffect, useMemo, useState } from "react";

import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import {
  GetProposalsActivityQueryVariables,
  Query_ProposalsActivity_Proposals_Items,
} from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";
import { NetworkStatus } from "@apollo/client";

interface UseProposalsActivityParams
  extends GetProposalsActivityQueryVariables {
  itemsPerPage: number;
  daoId: DaoIdEnum;
}

type ProposalActivityData = {
  totalProposals: number;
  votedProposals: number;
  neverVoted: number;
  winRate: number;
  yesRate: number;
  avgTimeBeforeEnd: number;
  proposals: Query_ProposalsActivity_Proposals_Items[];
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
  limit,
  orderBy,
  orderDirection,
  userVoteFilter,
  itemsPerPage,
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const [accumulatedProposals, setAccumulatedProposals] = useState<
    Query_ProposalsActivity_Proposals_Items[]
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
        fromDate,
        skip,
        limit,
        orderBy,
        orderDirection,
        userVoteFilter,
      },
      ...queryOptions,
    });

  useEffect(() => {
    setCurrentPage(1);
    setAccumulatedProposals([]);
  }, [address, daoId, fromDate, orderBy, orderDirection, userVoteFilter]);

  useEffect(() => {
    if (data?.proposalsActivity?.proposals) {
      if (currentPage === 1) {
        setAccumulatedProposals(
          (data.proposalsActivity.proposals ?? []).filter(
            Boolean,
          ) as Query_ProposalsActivity_Proposals_Items[],
        );
      }
    }
  }, [data?.proposalsActivity?.proposals, currentPage]);

  // Calculate pagination values
  const pagination = useMemo(() => {
    const totalPages = data?.proposalsActivity?.totalProposals
      ? Math.ceil(data.proposalsActivity.totalProposals / itemsPerPage)
      : 1;
    const currentPageCalc = skip ? Math.floor(skip / itemsPerPage) + 1 : 1;
    const hasNextPage = currentPageCalc < totalPages;
    const hasPreviousPage = currentPageCalc > 1;

    return {
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: currentPageCalc,
    };
  }, [data?.proposalsActivity?.totalProposals, skip, itemsPerPage]);

  const totalProposals = data?.proposalsActivity?.totalProposals || 0;
  const totalPages = totalProposals
    ? Math.ceil(totalProposals / itemsPerPage)
    : 1;
  const hasNextPage = currentPage < totalPages;

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || networkStatus === NetworkStatus.fetchMore) return;
    try {
      await fetchMore({
        variables: {
          address,
          fromDate,
          skip: accumulatedProposals.length,
          limit,
          orderBy,
          orderDirection,
          userVoteFilter,
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
          ].filter(
            (item): item is Query_ProposalsActivity_Proposals_Items =>
              item !== null,
          );

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

  return {
    data: processedData,
    loading: networkStatus === NetworkStatus.loading,
    error: error || null,
    refetch,
    pagination,
    fetchNextPage,
    fetchingMore: networkStatus === NetworkStatus.fetchMore,
  };
};
