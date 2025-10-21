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
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}

export interface UseAccountPowerParams {
  address: string;
  daoId: DaoIdEnum;
}

export const useAccountPower = ({
  address,
  daoId,
}: UseAccountPowerParams): UseAccountPowerResult => {
  // Main account power query
  const { data, loading, error, refetch } = useGetAccountPowerQuery({
    variables: {
      address,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !address, // Skip query if no address provided
  });

  // Extract and transform voting power
  const { accountPower, votingPower } = useMemo(() => {
    if (!data?.accountPower) {
      return {
        accountPower: null,
        votingPower: "0",
      };
    }

    return {
      accountPower: data.accountPower,
      votingPower: formatNumberUserReadable(
        Number(formatEther(BigInt(data.accountPower.votingPower))),
      ),
    };
  }, [data]);

  return {
    accountPower,
    votingPower,
    loading,
    error,
    refetch,
  };
};
