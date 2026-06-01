"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useParams } from "next/navigation";

import { useVotingPowerByAccountId } from "@anticapture/client/hooks";
import type { VotingPowerByAccountIdPathParamsDaoEnumKey } from "@anticapture/client";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

export const useConnectedWalletVotingPower = () => {
  const { address } = useAccount();
  const { daoId } = useParams<{ daoId: string }>();

  const daoIdEnum = daoId?.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum] ?? null;

  const { data, isLoading } = useVotingPowerByAccountId(
    daoIdEnum.toLowerCase() as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address ?? "",
    undefined,
    { query: { enabled: Boolean(address && daoConfig) } },
  );

  return {
    votingPower: data?.votingPower
      ? formatNumberUserReadable(
          Number(formatUnits(data.votingPower, daoConfig.decimals)),
        )
      : null,
    loading: isLoading,
  };
};
