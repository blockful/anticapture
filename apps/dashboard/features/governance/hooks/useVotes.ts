import {
  QueryInput_VotesByProposalId_OrderBy,
  QueryInput_VotesByProposalId_OrderDirection,
} from "@anticapture/graphql-client";
import {
  GetVotesQuery,
  useGetVotesQuery,
  useGetVotingPowerChangeLazyQuery,
} from "@anticapture/graphql-client/hooks";
import { ApolloError } from "@apollo/client";
import { useMemo, useState, useCallback, useEffect } from "react";

import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { DaoIdEnum } from "@/shared/types/daos";

type VotingPowerVariation = {
  previousVotingPower: string;
  currentVotingPower: string;
  absoluteChange: string;
  percentageChange: string;
};

// Enhanced vote type with historical voting power
export type VoteWithHistoricalPower = NonNullable<
  NonNullable<GetVotesQuery["votesByProposalId"]>["items"][number]
> & {
  votingPowerVariation?: VotingPowerVariation;
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
      orderBy: orderBy as QueryInput_VotesByProposalId_OrderBy,
      orderDirection:
        orderDirection as QueryInput_VotesByProposalId_OrderDirection,
    };
  }, [proposalId, limit, orderBy, orderDirection]);

  // Main votes query
  const { data, loading, error, fetchMore } = useGetVotesQuery({
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
        (vote) => !vote.votingPowerVariation,
      );

      if (!votesNeedingData.length || proposalStartTimestamp === undefined)
        return;

      try {
        const addresses = votesNeedingData.map((vote) => vote.voterAddress);

        const result = await getVotingPowerChange({
          variables: {
            addresses,
            fromDate: (
              proposalStartTimestamp / 1000 -
              DAYS_IN_SECONDS["30d"]
            ).toString(),
            toDate: (proposalStartTimestamp / 1000).toString(),
          },
          context: {
            headers: {
              "anticapture-dao-id": daoId,
            },
          },
        });

        // Update votes with historical voting power
        if (result.data?.votingPowerVariations) {
          const powerChanges = result.data.votingPowerVariations.items?.reduce(
            (acc, item) => {
              if (item?.accountId) acc[item.accountId] = item;
              return acc;
            },
            {} as Record<string, VotingPowerVariation>,
          );

          // Update only the votes that were fetched and don't already have historical voting power
          setAllVotes((prevVotes) =>
            prevVotes.map((vote) => {
              // Only update if this vote was in the fetch list
              const wasFetched = votesNeedingData.some(
                (v) => v.voterAddress === vote.voterAddress,
              );
              if (wasFetched) {
                return {
                  ...vote,
                  votingPowerVariation: powerChanges[vote.voterAddress],
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
    [daoId, getVotingPowerChange, proposalStartTimestamp],
  );

  // Reset accumulated votes when sorting parameters change
  useEffect(() => {
    setAllVotes([]);
    setIsLoadingMore(false);
  }, [orderBy, orderDirection]);

  // Initialize allVotes on first load or when data changes after reset
  useEffect(() => {
    if (data?.votesByProposalId?.items && allVotes.length === 0) {
      const initialVotes = data.votesByProposalId
        .items as VoteWithHistoricalPower[];
      setAllVotes(initialVotes);
      // Fetch voting power for initial votes
      fetchVotingPowerForVotes(initialVotes);
    }
  }, [
    data?.votesByProposalId?.items,
    allVotes.length,
    fetchVotingPowerForVotes,
  ]);

  // Use accumulated votes for infinite scroll
  const votes = allVotes;

  // Extract total count
  const totalCount = useMemo(() => {
    return data?.votesByProposalId?.totalCount || 0;
  }, [data?.votesByProposalId?.totalCount]);

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
          if (!fetchMoreResult?.votesByProposalId?.items) return previousResult;

          // Append new votes to existing ones in the GraphQL cache
          const newVotes = fetchMoreResult.votesByProposalId
            .items as VoteWithHistoricalPower[];
          setAllVotes((prev) => [...prev, ...newVotes]);

          // Fetch voting power for new votes
          fetchVotingPowerForVotes(newVotes);

          // Return the merged result for the cache
          return {
            votesByProposalId: {
              ...fetchMoreResult.votesByProposalId,
              items: [
                ...(previousResult.votesByProposalId?.items || []),
                ...newVotes,
              ],
              totalCount: fetchMoreResult.votesByProposalId.totalCount || 0,
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
