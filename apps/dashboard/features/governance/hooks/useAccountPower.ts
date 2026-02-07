import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetAccountPowerQuery,
  useGetAccountPowerQuery,
} from "@anticapture/graphql-client/hooks";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatUnits } from "viem";

export interface UseAccountPowerResult {
  accountPower: GetAccountPowerQuery["votingPowerByAccountId"] | null;
  votingPower: string;
  rawVotingPower: string;
  votes: GetAccountPowerQuery["votesByProposalId"] | null;
  hasVoted: boolean;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}

export interface UseAccountPowerParams {
  address: string;
  daoId: DaoIdEnum;
  proposalId: string;
  decimals: number;
}

export const useVoterInfo = ({
  address,
  daoId,
  proposalId,
  decimals,
}: UseAccountPowerParams): UseAccountPowerResult => {
  // Main account power query
  const { data, loading, error, refetch } = useGetAccountPowerQuery({
    variables: {
      address,
      addresses: [address],
      proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !address || !proposalId, // Skip query if no address or proposalId provided
  });

  if (!data?.votingPowerByAccountId) {
    return {
      accountPower: null,
      votingPower: "0",
      rawVotingPower: "0",
      votes: null,
      hasVoted: false,
      loading,
      error,
      refetch,
    };
  }

  const rawVotingPower = data.votingPowerByAccountId.votingPower;

  return {
    accountPower: data.votingPowerByAccountId,
    votingPower: formatNumberUserReadable(
      Number(
        formatUnits(BigInt(rawVotingPower), decimals),
      ),
    ),
    rawVotingPower,
    votes: data.votesByProposalId || null,
    hasVoted: !!data.votesByProposalId,
    loading,
    error,
    refetch,
  };
};
