import { useMemo, useState, useCallback, useEffect } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetVotesOnchainsQuery,
  useGetVotesOnchainsQuery,
} from "@anticapture/graphql-client/hooks";

export interface UseVotesResult {
  votes: GetVotesOnchainsQuery["votesOnchains"]["items"];
  totalCount: number;
  loading: boolean;
  error: ApolloError | undefined;
  // Infinite scroll functions
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
}

export interface UseVotesParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
  limit?: number;
}

export const useVotes = ({
  daoId,
  proposalId,
  limit = 10,
}: UseVotesParams = {}): UseVotesResult => {
  // State for infinite scroll
  const [allVotes, setAllVotes] = useState<
    GetVotesOnchainsQuery["votesOnchains"]["items"]
  >([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query variables for infinite scroll (forward only)
  const queryVariables = useMemo(() => {
    const baseVars = {
      proposalId,
      limit,
    };

    if (!currentCursor) {
      // First page
      return baseVars;
    }

    // Always forward for infinite scroll
    return {
      ...baseVars,
      after: currentCursor,
    };
  }, [proposalId, limit, currentCursor]);

  // Main votes query
  const { data, loading, error, fetchMore } = useGetVotesOnchainsQuery({
    variables: queryVariables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
  });

  // Initialize allVotes on first load
  useEffect(() => {
    if (data?.votesOnchains?.items && allVotes.length === 0 && !currentCursor) {
      setAllVotes(data.votesOnchains.items);
    }
  }, [data?.votesOnchains?.items, allVotes.length, currentCursor]);

  // Use accumulated votes for infinite scroll
  const votes = allVotes;

  // Extract pagination info
  const pageInfo = useMemo(() => {
    return (
      data?.votesOnchains?.pageInfo || {
        startCursor: null,
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    );
  }, [data?.votesOnchains?.pageInfo]);

  // Extract total count
  const totalCount = useMemo(() => {
    return data?.votesOnchains?.totalCount || 0;
  }, [data?.votesOnchains?.totalCount]);

  // Load more votes for infinite scroll
  const loadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      await fetchMore({
        variables: {
          proposalId,
          limit,
          after: pageInfo.endCursor,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          // Append new votes to existing ones in the GraphQL cache
          const newVotes = fetchMoreResult.votesOnchains?.items || [];
          setAllVotes((prev) => [...prev, ...newVotes]);

          // Return the new result for the cache
          return {
            ...fetchMoreResult,
            votesOnchains: {
              ...fetchMoreResult.votesOnchains,
              items: [
                ...(previousResult.votesOnchains?.items || []),
                ...newVotes,
              ],
            },
          };
        },
      });

      setCurrentCursor(pageInfo.endCursor || null);
    } catch (error) {
      console.error("Error loading more votes:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    pageInfo.hasNextPage,
    pageInfo.endCursor,
    isLoadingMore,
    fetchMore,
    proposalId,
    limit,
  ]);

  return {
    votes,
    totalCount,
    loading,
    error,
    loadMore,
    hasNextPage: pageInfo.hasNextPage,
    isLoadingMore,
  };
};
