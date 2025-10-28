import { DaoConfiguration } from "@/shared/dao-config/types";
import { AverageTurnoutResponse } from "@/shared/hooks";
import { formatNumberUserReadable } from "@/shared/utils";
import { useMemo } from "react";
import { formatEther } from "viem";

export const useDaoQuorumStats = ({
  daoData,
  averageTurnout,
  totalSupply,
  delegatedSupply,
  daoConfig,
}: {
  daoData?: { quorum?: string } | null;
  averageTurnout: {
    data?: AverageTurnoutResponse | null;
  } | null;
  totalSupply?: string;
  delegatedSupply: { data?: { currentDelegatedSupply?: string } | null };
  daoConfig: DaoConfiguration;
}) => {
  return useMemo(() => {
    const quorumValue = daoData?.quorum
      ? Number(daoData.quorum) / 10 ** 18
      : null;
    const turnoutTokens = averageTurnout?.data
      ? Number(averageTurnout.data.currentAverageTurnout) / 10 ** 18
      : null;

    const averageTurnoutPercentAboveQuorum =
      quorumValue && turnoutTokens
        ? (turnoutTokens / quorumValue - 1) * 100
        : 0;

    const quorumMinPercentage =
      daoData?.quorum &&
      totalSupply !== undefined &&
      formatEther(
        (BigInt(daoData.quorum) * BigInt(1e20)) /
          BigInt(totalSupply ?? ("1" as string)),
      );

    const quorumMinPercentageDelSupply =
      delegatedSupply.data?.currentDelegatedSupply &&
      formatEther(
        (BigInt(delegatedSupply.data.currentDelegatedSupply) * BigInt(30)) /
          BigInt(100),
      );

    const quorumValueTotalSupply = quorumValue
      ? `${formatNumberUserReadable(quorumValue)} `
      : "No Quorum";

    const quorumValueDelSupply = quorumMinPercentageDelSupply
      ? `${formatNumberUserReadable(parseFloat(quorumMinPercentageDelSupply))} `
      : "No Quorum";

    const quorumPercentageDelSupply = quorumMinPercentageDelSupply
      ? `(30% ${daoConfig.daoOverview.rules?.quorumCalculation})`
      : "(N/A)";

    const quorumPercentageTotalSupply = quorumMinPercentage
      ? `(${parseFloat(quorumMinPercentage).toFixed(1)}% ${daoConfig.daoOverview.rules?.quorumCalculation})`
      : "(N/A)";

    const quorumPercentage =
      daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
        ? quorumPercentageDelSupply
        : quorumPercentageTotalSupply;

    const quorumValueFormatted =
      daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
        ? quorumValueDelSupply
        : quorumValueTotalSupply;

    return {
      quorumValue,
      averageTurnoutPercentAboveQuorum,
      quorumValueFormatted,
      quorumPercentage,
    };
  }, [
    daoData?.quorum,
    averageTurnout?.data,
    totalSupply,
    delegatedSupply.data?.currentDelegatedSupply,
    daoConfig,
  ]);
};
