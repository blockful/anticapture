import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import { QueryInput_ProposalsActivity_DaoId } from "@anticapture/graphql-client";
import { useMemo } from "react";

interface UseProposalsActivityParams {
  address: string;
  daoId: QueryInput_ProposalsActivity_DaoId;
  fromDate?: number;
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
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const { data, loading, error, refetch } = useGetProposalsActivityQuery({
    variables: {
      address,
      daoId,
      fromDate,
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
