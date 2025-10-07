import { useMemo, useState, useCallback, useEffect } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetVotesOnchainsQuery,
  useGetVotesOnchainsQuery,
  useGetVotingPowerChangeLazyQuery,
} from "@anticapture/graphql-client/hooks";
import { QueryInput_HistoricalVotingPower_Days } from "@anticapture/graphql-client";

// Enhanced vote type with historical voting power
export type VoteWithHistoricalPower =
  GetVotesOnchainsQuery["votesOnchains"]["items"][0] & {
    historicalVotingPower?: string;
  };

export interface UseVotesResult {
  votes: VoteWithHistoricalPower[];
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
  orderBy?: string;
  orderDirection?: string;
}

export const useVotes = ({
  daoId,
  proposalId,
  limit = 10,
  orderBy = "timestamp",
  orderDirection = "desc",
}: UseVotesParams = {}): UseVotesResult => {
  // State for infinite scroll
  const [allVotes, setAllVotes] = useState<VoteWithHistoricalPower[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query variables for infinite scroll (forward only)
  const queryVariables = useMemo(() => {
    const baseVars = {
      proposalId,
      limit,
      orderBy,
      orderDirection,
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
  }, [proposalId, limit, orderBy, orderDirection, currentCursor]);

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

  // Lazy query for fetching voting power changes
  const [getVotingPowerChange] = useGetVotingPowerChangeLazyQuery();

  // Function to fetch voting power for specific votes
  const fetchVotingPowerForVotes = useCallback(
    async (votes: VoteWithHistoricalPower[]) => {
      if (!votes.length || !daoId) return;

      // Filter out votes that already have historical voting power
      const votesNeedingData = votes.filter(
        (vote) => !vote.historicalVotingPower,
      );

      if (!votesNeedingData.length) return;

      try {
        const addresses = votesNeedingData.map((vote) => vote.voterAccountId);

        const result = await getVotingPowerChange({
          variables: {
            addresses,
            days: QueryInput_HistoricalVotingPower_Days["30d"],
          },
          context: {
            headers: {
              "anticapture-dao-id": daoId,
            },
          },
        });

        // Update votes with historical voting power
        if (result.data?.historicalVotingPower) {
          const powerChanges: Record<string, string> = {};
          result.data.historicalVotingPower.forEach((item) => {
            if (item?.address && item?.votingPower) {
              powerChanges[item.address] = item.votingPower;
            }
          });

          // Update only the votes that were fetched and don't already have historical voting power
          setAllVotes((prevVotes) =>
            prevVotes.map((vote) => {
              // Only update if this vote was in the fetch list
              const wasFetched = votesNeedingData.some(
                (v) => v.voterAccountId === vote.voterAccountId,
              );
              if (wasFetched) {
                // Set historical voting power to the returned value or "0" if not found
                const historicalVP = powerChanges[vote.voterAccountId] || "0";
                return {
                  ...vote,
                  historicalVotingPower: historicalVP,
                };
              }
              // Return the vote unchanged
              return vote;
            }),
          );
        }
      } catch (error) {
        console.error("Error fetching voting power changes:", error);
      }
    },
    [getVotingPowerChange, daoId],
  );

  // Reset accumulated votes when sorting parameters change
  useEffect(() => {
    setAllVotes([]);
    setCurrentCursor(null);
    setIsLoadingMore(false);
  }, [orderBy, orderDirection]);

  // Initialize allVotes on first load or when data changes after reset
  useEffect(() => {
    if (data?.votesOnchains?.items && allVotes.length === 0 && !currentCursor) {
      const initialVotes = data.votesOnchains
        .items as VoteWithHistoricalPower[];
      setAllVotes(initialVotes);
      // Fetch voting power for initial votes
      fetchVotingPowerForVotes(initialVotes);
    }
  }, [
    data?.votesOnchains?.items,
    allVotes.length,
    currentCursor,
    fetchVotingPowerForVotes,
  ]);

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
          const newVotes = (fetchMoreResult.votesOnchains?.items ||
            []) as VoteWithHistoricalPower[];
          setAllVotes((prev) => [...prev, ...newVotes]);

          // Fetch voting power for new votes
          fetchVotingPowerForVotes(newVotes);

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
    fetchVotingPowerForVotes,
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
