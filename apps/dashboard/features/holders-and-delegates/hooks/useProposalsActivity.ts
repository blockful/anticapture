import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import {
  GetProposalsActivityQuery,
  GetProposalsActivityQueryVariables,
  QueryInput_ProposalsActivity_DaoId,
} from "@anticapture/graphql-client";
import { useMemo } from "react";

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
}: GetProposalsActivityQueryVariables): UseProposalsActivityResult => {
  const { data, loading, error, refetch } = useGetProposalsActivityQuery({
    variables: {
      address,
      daoId: daoId as unknown as QueryInput_ProposalsActivity_DaoId,
      fromDate,
      skip,
      limit,
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
