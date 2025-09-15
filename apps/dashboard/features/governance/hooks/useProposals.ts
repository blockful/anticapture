import { useCallback, useMemo, useState } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  useGetProposalsQuery,
  GetProposalsQuery,
  QueryInput_Proposals_OrderDirection,
} from "@anticapture/graphql-client/hooks";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";

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
  error: ApolloError | undefined;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  isPaginationLoading: boolean;
}

export interface UseProposalsParams {
  fromDate?: number;
  orderDirection?: "asc" | "desc";
  status?: unknown;
  itemsPerPage?: number;
}

export const useProposals = ({
  fromDate,
  orderDirection = "desc",
  status,
  itemsPerPage = 10,
}: UseProposalsParams = {}): UseProposalsResult => {
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [allProposals, setAllProposals] = useState<GovernanceProposal[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const queryVariables = useMemo(
    () => ({
      skip: 0, // Always start from 0 for first query
      limit: itemsPerPage,
      orderDirection: orderDirection as QueryInput_Proposals_OrderDirection,
      status,
      fromDate,
    }),
    [itemsPerPage, orderDirection, status, fromDate],
  );

  // Main proposals query
  const { data, loading, error, fetchMore } = useGetProposalsQuery({
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": DaoIdEnum.ENS,
      },
    },
  });

  // Transform and filter raw GraphQL data
  const rawProposals = useMemo(() => {
    const currentProposals = data?.proposals?.items || [];

    // Remove null values
    return currentProposals
      .filter(
        (proposal): proposal is NonNullable<typeof proposal> =>
          proposal !== null,
      )
      .map((proposal) => ({
        id: proposal.id,
        daoId: proposal.daoId,
        txHash: proposal.txHash,
        description: proposal.description,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        timestamp: proposal.timestamp,
        status: proposal.status,
        proposerAccountId: proposal.proposerAccountId,
        title: proposal.title || "",
        endTimestamp: proposal.endTimestamp,
        quorum: proposal.quorum,
        startTimestamp: proposal.startTimestamp,
      }));
  }, [data]);

  // Initialize allProposals on first load
  useMemo(() => {
    if (rawProposals.length > 0 && !hasInitialized) {
      const normalizedProposals = rawProposals.map(
        transformToGovernanceProposal,
      );
      setAllProposals(normalizedProposals);
      setHasInitialized(true);

      // Check if we've reached the end on first load
      if (rawProposals.length < itemsPerPage) {
        setHasReachedEnd(true);
      }
    }
  }, [rawProposals, hasInitialized, itemsPerPage]);

  // Pagination info
  const pagination: PaginationInfo = useMemo(() => {
    const hasNextPage = !hasReachedEnd;
    const currentPage = Math.ceil(allProposals.length / itemsPerPage);
    const totalCount = allProposals.length; // We only know about items we've fetched so far
    const totalPages = hasReachedEnd ? currentPage : currentPage + 1; // +1 if more pages might exist

    return {
      hasNextPage,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount: allProposals.length,
    };
  }, [allProposals.length, itemsPerPage, hasReachedEnd]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      const nextSkip = allProposals.length; // Skip the items we already have

      await fetchMore({
        variables: {
          ...queryVariables,
          skip: nextSkip,
        },
        updateQuery: (
          previousResult: GetProposalsQuery,
          { fetchMoreResult }: { fetchMoreResult: GetProposalsQuery },
        ) => {
          if (!fetchMoreResult || !fetchMoreResult.proposals?.items?.length) {
            return previousResult;
          }

          // Filter and transform new proposals
          const newRawProposals = (fetchMoreResult.proposals?.items || [])
            .filter(
              (proposal): proposal is NonNullable<typeof proposal> =>
                proposal !== null && proposal.daoId === DaoIdEnum.ENS,
            )
            .map((proposal) => ({
              id: proposal.id,
              daoId: proposal.daoId,
              txHash: proposal.txHash,
              description: proposal.description,
              forVotes: proposal.forVotes,
              againstVotes: proposal.againstVotes,
              abstainVotes: proposal.abstainVotes,
              timestamp: proposal.timestamp,
              status: proposal.status,
              proposerAccountId: proposal.proposerAccountId,
              title: proposal.title || "",
              endTimestamp: proposal.endTimestamp,
              quorum: proposal.quorum,
              startTimestamp: proposal.startTimestamp,
            }));

          // Transform to governance proposals and append to existing list
          const newGovernanceProposals = newRawProposals.map(
            transformToGovernanceProposal,
          );

          if (newGovernanceProposals.length > 0) {
            setAllProposals((prev) => [...prev, ...newGovernanceProposals]);
          }

          // Check if we've reached the end - if we got fewer items than requested page size
          if (fetchMoreResult.proposals?.items?.length < itemsPerPage) {
            setHasReachedEnd(true);
          }

          return {
            ...fetchMoreResult,
            proposals: {
              ...fetchMoreResult.proposals,
              items: [
                ...(previousResult.proposals?.items || []),
                ...(fetchMoreResult.proposals?.items || []),
              ],
            },
          };
        },
      });
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    isPaginationLoading,
    queryVariables,
    allProposals,
    itemsPerPage,
  ]);

  return {
    proposals: allProposals,
    loading,
    error,
    pagination,
    fetchNextPage,
    isPaginationLoading,
  };
};
