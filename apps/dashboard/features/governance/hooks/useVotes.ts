import { useMemo } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetVotesOnchainsQuery,
  useGetVotesOnchainsQuery,
} from "@anticapture/graphql-client/hooks";

export interface UseVotesResult {
  votes: GetVotesOnchainsQuery["votesOnchains"]["items"];
  pageInfo: GetVotesOnchainsQuery["votesOnchains"]["pageInfo"];
  totalCount: number;
  loading: boolean;
  error: ApolloError | undefined;
}

export interface UseVotesParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
}

export const useVotes = ({
  daoId,
  proposalId,
}: UseVotesParams = {}): UseVotesResult => {
  // Main votes query
  const { data, loading, error } = useGetVotesOnchainsQuery({
    variables: {
      proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  // Transform raw GraphQL data (no need to filter since it's done server-side)
  const votes = useMemo(() => {
    return data?.votesOnchains?.items || [];
  }, [data?.votesOnchains?.items]);

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

  return {
    votes,
    pageInfo,
    totalCount,
    loading,
    error,
  };
};
