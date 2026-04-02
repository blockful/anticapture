"use client";

import { useGetVotingPowerQuery } from "@anticapture/graphql-client/hooks";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export const useConnectedWalletVotingPower = () => {
  const { address } = useAccount();
  const { daoId } = useParams<{ daoId: string }>();

  const daoIdEnum = daoId?.toUpperCase() as DaoIdEnum | undefined;
  const daoConfig = daoIdEnum ? daoConfigByDaoId[daoIdEnum] : null;

  const { data, loading } = useGetVotingPowerQuery({
    variables: {
      address: address ?? "",
    },
    context: {
      headers: {
        "anticapture-dao-id": daoIdEnum,
        ...getAuthHeaders(),
      },
    },
    skip: !address || !daoIdEnum || !daoConfig,
  });

  const votingPower = useMemo(() => {
    if (!daoConfig || !data?.votingPowerByAccountId?.votingPower) {
      return null;
    }

    return formatNumberUserReadable(
      Number(
        formatUnits(
          BigInt(data.votingPowerByAccountId.votingPower),
          daoConfig.decimals,
        ),
      ),
    );
  }, [daoConfig, data?.votingPowerByAccountId?.votingPower]);

  return {
    votingPower,
    loading,
  };
};
