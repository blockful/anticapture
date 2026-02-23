import {
  GetProposalNonVotersQuery,
  useGetProposalNonVotersQuery,
  QueryInput_ProposalNonVoters_OrderDirection,
} from "@anticapture/graphql-client/hooks";
import { ApolloError, NetworkStatus } from "@apollo/client";
import { useMemo, useCallback } from "react";

import { DaoIdEnum } from "@/shared/types/daos";

// Non-voter type
export type NonVoter = NonNullable<
  GetProposalNonVotersQuery["proposalNonVoters"]
>["items"][0] & {
  isSubRow?: boolean;
};

export interface UseNonVotersResult {
  nonVoters: NonVoter[];
  totalCount: number;
  loading: boolean;
  error: ApolloError | undefined;
  // Pagination functions
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
}

export interface UseNonVotersParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
  limit?: number;
  orderDirection?: "asc" | "desc";
}

export const useNonVoters = ({
  daoId,
  proposalId,
  limit = 10,
  orderDirection = "desc",
}: UseNonVotersParams = {}): UseNonVotersResult => {
  // Build query variables - always skip: 0 for initial query
  const queryVariables = useMemo(
    () => ({
      id: proposalId || "",
      limit,
      skip: 0,
      orderDirection:
        orderDirection === "asc"
          ? QueryInput_ProposalNonVoters_OrderDirection.Asc
          : QueryInput_ProposalNonVoters_OrderDirection.Desc,
    }),
    [proposalId, limit, orderDirection],
  );

  // Main non-voters query
  const { data, loading, error, fetchMore, networkStatus } =
    useGetProposalNonVotersQuery({
      variables: queryVariables,
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
      skip: !proposalId,
      notifyOnNetworkStatusChange: true,
    });

  // Extract non-voters and total count from data
  const nonVoters = (data?.proposalNonVoters?.items as NonVoter[]) || [];
  const totalCount = data?.proposalNonVoters?.totalCount || 0;

  // Calculate if there's a next page
  const hasNextPage = nonVoters.length < totalCount;
  const isLoadingMore = networkStatus === NetworkStatus.fetchMore;

  // Load more non-voters for pagination
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    try {
      await fetchMore({
        variables: {
          id: proposalId || "",
          limit,
          skip: nonVoters.length,
          orderDirection:
            orderDirection === "asc"
              ? QueryInput_ProposalNonVoters_OrderDirection.Asc
              : QueryInput_ProposalNonVoters_OrderDirection.Desc,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.proposalNonVoters) return prev;

          const prevItems = prev.proposalNonVoters?.items || [];
          const newItems = fetchMoreResult.proposalNonVoters.items || [];

          return {
            ...fetchMoreResult,
            proposalNonVoters: {
              ...fetchMoreResult.proposalNonVoters,
              items: [...prevItems, ...newItems],
            },
          };
        },
      });
    } catch (error) {
      console.error("Error loading more non-voters:", error);
    }
  }, [
    hasNextPage,
    isLoadingMore,
    fetchMore,
    proposalId,
    limit,
    nonVoters.length,
    orderDirection,
  ]);

  return {
    nonVoters,
    totalCount,
    loading,
    error,
    loadMore,
    hasNextPage,
    isLoadingMore,
  };
};
