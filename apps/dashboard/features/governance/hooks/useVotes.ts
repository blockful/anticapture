import { useMemo, useState, useCallback, useEffect } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetProposalVotesQuery,
  useGetProposalVotesQuery,
  useGetVotingPowerChangeLazyQuery,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_HistoricalVotingPower_Days,
  QueryInput_ProposalVotes_OrderBy,
  QueryInput_ProposalVotes_OrderDirection,
} from "@anticapture/graphql-client";

// Enhanced vote type with historical voting power
export type VoteWithHistoricalPower = NonNullable<
  NonNullable<GetProposalVotesQuery["proposalVotes"]>["items"][number]
> & {
  historicalVotingPower?: string;
  isSubRow?: boolean;
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
  proposalStartTimestamp?: number;
}

export const useVotes = ({
  daoId,
  proposalId,
  proposalStartTimestamp,
  limit = 10,
  orderBy = "timestamp",
  orderDirection = "desc",
}: UseVotesParams = {}): UseVotesResult => {
  // State for infinite scroll
  const [allVotes, setAllVotes] = useState<VoteWithHistoricalPower[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query variables for skip-based pagination
  const queryVariables = useMemo(() => {
    return {
      proposalId: proposalId!,
      limit,
      skip: 0, // Always fetch from beginning, we'll handle append in fetchMore
      orderBy: orderBy as QueryInput_ProposalVotes_OrderBy,
      orderDirection: orderDirection as QueryInput_ProposalVotes_OrderDirection,
    };
  }, [proposalId, limit, orderBy, orderDirection]);

  // Main votes query
  const { data, loading, error, fetchMore } = useGetProposalVotesQuery({
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
        const addresses = votesNeedingData.map((vote) => vote.voterAddress);

        const result = await getVotingPowerChange({
          variables: {
            addresses,
            days: QueryInput_HistoricalVotingPower_Days["30d"],
            fromDate: proposalStartTimestamp,
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
                (v) => v.voterAddress === vote.voterAddress,
              );
              if (wasFetched) {
                // Set historical voting power to the returned value or "0" if not found
                const historicalVP = powerChanges[vote.voterAddress] || "0";
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
    setIsLoadingMore(false);
  }, [orderBy, orderDirection]);

  // Initialize allVotes on first load or when data changes after reset
  useEffect(() => {
    if (data?.proposalVotes?.items && allVotes.length === 0) {
      const initialVotes = data.proposalVotes
        .items as VoteWithHistoricalPower[];
      setAllVotes(initialVotes);
      // Fetch voting power for initial votes
      fetchVotingPowerForVotes(initialVotes);
    }
  }, [data?.proposalVotes?.items, allVotes.length, fetchVotingPowerForVotes]);

  // Use accumulated votes for infinite scroll
  const votes = allVotes;

  // Extract total count
  const totalCount = useMemo(() => {
    return data?.proposalVotes?.totalCount || 0;
  }, [data?.proposalVotes?.totalCount]);

  // Calculate if there are more pages
  const hasNextPage = useMemo(() => {
    return allVotes.length < totalCount;
  }, [allVotes.length, totalCount]);

  // Load more votes for infinite scroll with skip-based pagination
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      await fetchMore({
        variables: {
          proposalId,
          limit,
          skip: allVotes.length, // Skip already loaded votes
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.proposalVotes?.items) return previousResult;

          // Append new votes to existing ones in the GraphQL cache
          const newVotes = fetchMoreResult.proposalVotes
            .items as VoteWithHistoricalPower[];
          setAllVotes((prev) => [...prev, ...newVotes]);

          // Fetch voting power for new votes
          fetchVotingPowerForVotes(newVotes);

          // Return the merged result for the cache
          return {
            proposalVotes: {
              ...fetchMoreResult.proposalVotes,
              items: [
                ...(previousResult.proposalVotes?.items || []),
                ...newVotes,
              ],
              totalCount: fetchMoreResult.proposalVotes.totalCount || 0,
            },
          };
        },
      });
    } catch (error) {
      console.error("Error loading more votes:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasNextPage,
    isLoadingMore,
    fetchMore,
    proposalId,
    limit,
    allVotes.length,
    fetchVotingPowerForVotes,
  ]);

  return {
    votes,
    totalCount,
    loading,
    error,
    loadMore,
    hasNextPage,
    isLoadingMore,
  };
};
