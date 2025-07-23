import { useMemo } from "react";

import { useGetProposalsActivityQuery } from "@anticapture/graphql-client/hooks";
import { GetProposalsActivityQueryVariables } from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";

interface UseProposalsActivityParams
  extends GetProposalsActivityQueryVariables {
  itemsPerPage: number;
  daoId: DaoIdEnum;
}

interface UseProposalsActivityResult {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
  };
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
  itemsPerPage,
}: UseProposalsActivityParams): UseProposalsActivityResult => {
  const { data, loading, error, refetch } = useGetProposalsActivityQuery({
    variables: {
      address,
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

  // Calculate pagination values
  const pagination = useMemo(() => {
    const totalPages = processedData?.totalProposals
      ? Math.ceil(processedData.totalProposals / itemsPerPage)
      : 1;
    const currentPage = skip ? Math.floor(skip / itemsPerPage) + 1 : 1;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage,
    };
  }, [processedData?.totalProposals, skip, itemsPerPage]);

  return {
    data: processedData,
    loading,
    error: error || null,
    refetch,
    pagination,
  };
};
