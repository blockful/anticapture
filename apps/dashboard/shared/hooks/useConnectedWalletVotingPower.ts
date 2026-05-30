import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";

import { useVotingPowerByAccountId } from "@anticapture/client/hooks";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import type { VotingPowerByAccountIdPathParamsDaoEnumKey } from "@anticapture/client";

export const useConnectedWalletVotingPower = () => {
  const { address } = useAccount();
  const { daoId } = useParams<{ daoId: string }>();

  const daoIdEnum = daoId?.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum] ?? null;

  const { data, isLoading } = useVotingPowerByAccountId(
    daoId.toLowerCase() as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address ?? "",
    undefined,
    {
      query: {
        enabled: !!address && !!daoIdEnum,
      },
    },
  );

  return {
    votingPower:
      data && daoConfig
        ? formatNumberUserReadable(
            Number(formatUnits(data.votingPower, daoConfig.decimals)),
          )
        : null,
    isLoading,
  };
};
