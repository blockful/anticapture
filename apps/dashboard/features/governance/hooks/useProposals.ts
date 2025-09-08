import { useCallback, useMemo, useState } from "react";
import { useQuery, ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetProposalsDocument,
  GetProposalsQuery,
  QueryInput_Proposals_OrderDirection,
  Query_Proposals_Items,
} from "@anticapture/graphql-client/hooks";
import { ProposalStatus, ProposalState } from "@/features/governance/types";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { formatEther } from "viem";

export interface PaginationInfo {
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

type Proposal = Omit<Query_Proposals_Items, "endBlock" | "startBlock">;

// Helper function to transform GraphQL proposal data to governance component format
const transformToGovernanceProposal = (
  graphqlProposal: Proposal,
): GovernanceProposal => {
  const forVotes = parseInt(graphqlProposal.forVotes);
  const againstVotes = parseInt(graphqlProposal.againstVotes);
  const abstainVotes = parseInt(graphqlProposal.abstainVotes);
  const quorum = parseInt(graphqlProposal.quorum);

  const total = forVotes + againstVotes + abstainVotes;

  const forPercentage = total > 0 ? Math.round((forVotes / total) * 100) : 0;
  const againstPercentage =
    total > 0 ? Math.round((againstVotes / total) * 100) : 0;

  // Map GraphQL status to our enum
  const getProposalStatus = (status: string): ProposalStatus => {
    switch (status.toLowerCase()) {
      case "active":
        return ProposalStatus.ONGOING;
      case "succeeded":
      case "executed":
        return ProposalStatus.EXECUTED;
      case "defeated":
        return ProposalStatus.DEFEATED;
      case "cancelled":
        return ProposalStatus.CANCELLED;
      case "pending":
        return ProposalStatus.PENDING;
      default:
        return ProposalStatus.PENDING;
    }
  };

  const formatVotes = (votes: number): number => {
    if (typeof votes !== "number" || isNaN(votes) || votes < 0) {
      return 0;
    }

    try {
      const formattedVotes = Number(formatEther(BigInt(Math.floor(votes))));
      return formattedVotes;
    } catch (error) {
      console.warn("Error formatting votes:", votes, error);
      return 0;
    }
  };

  const getProposalState = (status: string): ProposalState => {
    switch (status.toLowerCase()) {
      case "active":
        return ProposalState.ACTIVE;
      case "succeeded":
      case "executed":
      case "defeated":
      case "cancelled":
        return ProposalState.COMPLETED;
      case "pending":
      default:
        return ProposalState.WAITING_TO_START;
    }
  };

  // Helper function to calculate days difference
  const calculateDaysDiff = (
    timestamp: string,
    currentTime: number,
  ): number => {
    const diffSeconds = Math.abs(parseInt(timestamp) - currentTime);
    return Math.floor(diffSeconds / (24 * 60 * 60));
  };

  const getTimeText = (startTimestamp: string, endTimestamp: string) => {
    const now = Date.now() / 1000;
    const startTime = parseInt(startTimestamp);
    const endTime = parseInt(endTimestamp);

    if (startTime > now) {
      const days = calculateDaysDiff(startTimestamp, now);
      return `${days}d to start`;
    } else if (endTime > now) {
      const days = calculateDaysDiff(endTimestamp, now);
      return `${days}d left`;
    } else {
      const days = calculateDaysDiff(endTimestamp, now);
      return `${days}d ago`;
    }
  };

  // Calculate time text using the helper function
  const timeText = getTimeText(
    graphqlProposal.startTimestamp,
    graphqlProposal.endTimestamp,
  );

  return {
    id: graphqlProposal.id,
    title:
      graphqlProposal.title ||
      graphqlProposal.description?.slice(0, 100) + "..." ||
      "Untitled Proposal",
    status: getProposalStatus(graphqlProposal.status),
    state: getProposalState(graphqlProposal.status),
    description: graphqlProposal.description,
    proposer: graphqlProposal.proposerAccountId,
    votes: {
      for: forVotes,
      against: againstVotes,
      total: formatVotes(total),
      forPercentage,
      againstPercentage,
    },
    quorum: formatVotes(quorum),
    timeText,
  };
};

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
  const { data, loading, error, fetchMore } = useQuery(GetProposalsDocument, {
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
    const currentProposals = data?.proposals || [];
    // Filter for ENS proposals only and remove null values
    return currentProposals
      .filter(
        (
          proposal: Query_Proposals_Items | null,
        ): proposal is NonNullable<Query_Proposals_Items> =>
          proposal !== null && proposal.daoId === DaoIdEnum.ENS,
      )
      .map((proposal: NonNullable<Proposal>) => ({
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
          if (!fetchMoreResult || !fetchMoreResult.proposals?.length) {
            return previousResult;
          }

          // Filter and transform new proposals
          const newRawProposals = (fetchMoreResult.proposals || [])
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

          // Filter out any duplicates by ID
          const existingIds = new Set(allProposals.map((p) => p.id));
          const uniqueNewProposals = newGovernanceProposals.filter(
            (p) => !existingIds.has(p.id),
          );

          if (uniqueNewProposals.length > 0) {
            setAllProposals((prev) => [...prev, ...uniqueNewProposals]);
          }

          // Check if we've reached the end - if we got fewer items than requested page size
          if (fetchMoreResult.proposals.length < itemsPerPage) {
            setHasReachedEnd(true);
          }

          return {
            ...fetchMoreResult,
            proposals: [
              ...(previousResult.proposals || []),
              ...fetchMoreResult.proposals,
            ],
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
