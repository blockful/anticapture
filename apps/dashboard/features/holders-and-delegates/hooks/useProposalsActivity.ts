import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import {
  GetProposalsActivityQuery,
  QueryInput_ProposalsActivity_DaoId,
  QueryInput_ProposalsActivity_OrderBy,
  QueryInput_ProposalsActivity_OrderDirection,
  QueryInput_ProposalsActivity_UserVoteFilter_Items,
} from "@anticapture/graphql-client";
import { useMemo } from "react";

export type VoteFilterType = "yes" | "no" | "abstain" | "no-vote";
export type OrderByField =
  | "finalResult"
  | "userVote"
  | "votingPower"
  | "voteTiming";
export type OrderDirection = "asc" | "desc";

interface UseProposalsActivityParams {
  address: string;
  daoId: QueryInput_ProposalsActivity_DaoId;
  fromDate?: number;
  skip?: number;
  limit?: number;
  orderBy?: QueryInput_ProposalsActivity_OrderBy;
  orderDirection?: QueryInput_ProposalsActivity_OrderDirection;
  userVoteFilter?: QueryInput_ProposalsActivity_UserVoteFilter_Items;
}

interface UseProposalsActivityResult {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
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
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const { data, loading, error, refetch } = useGetProposalsActivityQuery({
    variables: {
      address,
      daoId: daoId as unknown as QueryInput_ProposalsActivity_DaoId,
      fromDate,
      skip,
      limit,
      orderBy,
      orderDirection,
      userVoteFilter,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  const processedData = useMemo(() => {
    if (!data?.proposalsActivity) return null;

    return {
      totalProposals: data.proposalsActivity.totalProposals,
      votedProposals: data.proposalsActivity.votedProposals,
      neverVoted: data.proposalsActivity.neverVoted,
      winRate: data.proposalsActivity.winRate,
      yesRate: data.proposalsActivity.yesRate,
      avgTimeBeforeEnd: data.proposalsActivity.avgTimeBeforeEnd,
      proposals:
        data.proposalsActivity.proposals?.map((item) => ({
          proposal: item?.proposal,
          userVote: item?.userVote,
        })) || [],
    };
  }, [data]);

  return {
    data: processedData,
    loading,
    error: error || null,
    refetch,
  };
};
