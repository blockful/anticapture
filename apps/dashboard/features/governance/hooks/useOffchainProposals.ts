import type {
  GetOffchainProposalsFromDaoQuery,
  QueryOffchainProposalsArgs,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_OffchainProposals_OrderDirection,
  useGetOffchainProposalsFromDaoQuery,
} from "@anticapture/graphql-client/hooks";
import type { ApolloError } from "@apollo/client";
import { useCallback, useMemo, useState, useEffect } from "react";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { ProposalStatus, ProposalState } from "@/features/governance/types";
import { getTimeText } from "@/features/governance/utils";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

import type { PaginationInfo } from "./useProposals";

type OffchainProposalArgs = Pick<
  QueryOffchainProposalsArgs,
  "status" | "fromDate"
>;

export interface UseOffchainProposalsParams extends OffchainProposalArgs {
  itemsPerPage?: number;
  daoId?: DaoIdEnum;
  skip?: boolean;
}

export interface UseOffchainProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: ApolloError | undefined;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  isPaginationLoading: boolean;
}

function offchainStateToProposalStatus(state: string): ProposalStatus {
  switch (state.toLowerCase()) {
    case "active":
      return ProposalStatus.ONGOING;
    case "closed":
      return ProposalStatus.EXECUTED;
    case "pending":
      return ProposalStatus.PENDING;
    default:
      return ProposalStatus.PENDING;
  }
}

function offchainStateToProposalState(state: string): ProposalState {
  switch (state.toLowerCase()) {
    case "active":
      return ProposalState.ACTIVE;
    case "closed":
      return ProposalState.COMPLETED;
    default:
      return ProposalState.WAITING_TO_START;
  }
}

type RawOffchainProposal = NonNullable<
  NonNullable<
    NonNullable<GetOffchainProposalsFromDaoQuery["offchainProposals"]>["items"]
  >[number]
>;

function transformOffchainProposal(p: RawOffchainProposal): GovernanceProposal {
  const timeText = getTimeText(String(p.start), String(p.end));
  return {
    id: p.id,
    daoId: p.spaceId,
    txHash: "",
    title: p.title || "Untitled Proposal",
    status: offchainStateToProposalStatus(p.state),
    state: offchainStateToProposalState(p.state),
    proposer: p.author,
    proposerAccountId: p.author,
    timestamp: String(p.created),
    startTimestamp: String(p.start),
    endTimestamp: String(p.end),
    votes: {
      for: "0",
      against: "0",
      total: "0",
      forPercentage: "0",
      againstPercentage: "0",
    },
    quorum: "0",
    timeText,
    targets: [],
    values: [],
  };
}

export const useOffchainProposals = ({
  fromDate,
  status,
  itemsPerPage = 10,
  daoId,
  skip = false,
}: UseOffchainProposalsParams = {}): UseOffchainProposalsResult => {
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [allProposals, setAllProposals] = useState<GovernanceProposal[]>([]);

  const queryVariables = useMemo(
    () => ({
      skip: 0,
      limit: itemsPerPage,
      orderDirection: QueryInput_OffchainProposals_OrderDirection.Desc,
      status,
      fromDate,
    }),
    [itemsPerPage, status, fromDate],
  );

  const { data, loading, error, fetchMore } =
    useGetOffchainProposalsFromDaoQuery({
      skip,
      variables: queryVariables,
      notifyOnNetworkStatusChange: true,
      context: {
        headers: {
          "anticapture-dao-id": daoId,
          ...getAuthHeaders(),
        },
      },
    });

  const rawProposals = useMemo(() => {
    return (data?.offchainProposals?.items ?? []).filter(
      (p): p is RawOffchainProposal => p !== null,
    );
  }, [data]);

  useEffect(() => {
    if (rawProposals.length > 0 && allProposals.length === 0) {
      setAllProposals(rawProposals.map(transformOffchainProposal));
    }
  }, [rawProposals, allProposals.length]);

  const pagination: PaginationInfo = useMemo(() => {
    const totalCount = data?.offchainProposals?.totalCount ?? 0;
    const currentItemsCount = allProposals.length;
    return {
      hasNextPage: currentItemsCount < totalCount,
      totalCount,
      currentPage: Math.ceil(currentItemsCount / itemsPerPage),
      totalPages: Math.ceil(totalCount / itemsPerPage),
      itemsPerPage,
      currentItemsCount,
    };
  }, [data?.offchainProposals?.totalCount, allProposals.length, itemsPerPage]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) return;
    setIsPaginationLoading(true);
    try {
      await fetchMore({
        variables: { ...queryVariables, skip: allProposals.length },
        updateQuery: (
          prev: GetOffchainProposalsFromDaoQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult: GetOffchainProposalsFromDaoQuery },
        ) => {
          const newItems = (
            fetchMoreResult?.offchainProposals?.items ?? []
          ).filter((p): p is RawOffchainProposal => p !== null);

          if (newItems.length > 0) {
            setAllProposals((existing) => [
              ...existing,
              ...newItems.map(transformOffchainProposal),
            ]);
          }

          return {
            ...fetchMoreResult,
            offchainProposals: {
              totalCount:
                fetchMoreResult.offchainProposals?.totalCount ??
                prev.offchainProposals?.totalCount ??
                0,
              ...fetchMoreResult.offchainProposals,
              items: [
                ...(prev.offchainProposals?.items ?? []),
                ...(fetchMoreResult.offchainProposals?.items ?? []),
              ],
            },
          };
        },
      });
    } catch (e) {
      console.error("Error fetching next offchain proposals page:", e);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    isPaginationLoading,
    queryVariables,
    allProposals.length,
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
