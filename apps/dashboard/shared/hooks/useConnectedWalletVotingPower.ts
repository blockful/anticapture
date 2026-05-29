"use client";

import { useVotingPowerByAccountId } from "@anticapture/client/hooks";
import type { VotingPowerByAccountIdPathParamsDaoEnumKey } from "@anticapture/client";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

export const useConnectedWalletVotingPower = () => {
  const { address } = useAccount();
  const { daoId } = useParams<{ daoId: string }>();

  const daoIdEnum = daoId?.toUpperCase() as DaoIdEnum | undefined;
  const daoConfig = daoIdEnum ? daoConfigByDaoId[daoIdEnum] : null;

  const { data, isLoading } = useVotingPowerByAccountId(
    (daoIdEnum?.toLowerCase() ??
      "") as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address ?? "",
    undefined,
    { query: { enabled: Boolean(address && daoIdEnum && daoConfig) } },
  );

  const votingPower = useMemo(() => {
    if (!daoConfig || !data?.votingPower) {
      return null;
    }

    return formatNumberUserReadable(
      Number(formatUnits(BigInt(data.votingPower), daoConfig.decimals)),
    );
  }, [daoConfig, data?.votingPower]);

  return {
    votingPower,
    loading: isLoading,
  };
};
