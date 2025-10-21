import { useMemo } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetAccountPowerQuery,
  useGetAccountPowerQuery,
} from "@anticapture/graphql-client/hooks";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatEther } from "viem";

export interface UseAccountPowerResult {
  accountPower: GetAccountPowerQuery["accountPower"] | null;
  votingPower: string;
  votesOnchain: GetAccountPowerQuery["votesOnchain"] | null;
  hasVoted: boolean;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}

export interface UseAccountPowerParams {
  address: string;
  daoId: DaoIdEnum;
  proposalId: string;
}

export const useVoterInfo = ({
  address,
  daoId,
  proposalId,
}: UseAccountPowerParams): UseAccountPowerResult => {
  // Main account power query
  const { data, loading, error, refetch } = useGetAccountPowerQuery({
    variables: {
      address,
      proposalId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !address || !proposalId, // Skip query if no address or proposalId provided
  });

  // Extract and transform voting power and votes onchain
  const { accountPower, votingPower, votesOnchain, hasVoted } = useMemo(() => {
    if (!data?.accountPower) {
      return {
        accountPower: null,
        votingPower: "0",
        votesOnchain: null,
        hasVoted: false,
      };
    }

    return {
      accountPower: data.accountPower,
      votingPower: formatNumberUserReadable(
        Number(formatEther(BigInt(data.accountPower.votingPower))),
      ),
      votesOnchain: data.votesOnchain || null,
      hasVoted: !!data.votesOnchain,
    };
  }, [data]);

  return {
    accountPower,
    votingPower,
    votesOnchain,
    hasVoted,
    loading,
    error,
    refetch,
  };
};
