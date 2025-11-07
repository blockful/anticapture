import { DaoConfiguration } from "@/shared/dao-config/types";
import { formatNumberUserReadable } from "@/shared/utils";
import { useMemo } from "react";
import { formatEther } from "viem";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";

export const useDaoQuorumStats = ({
  daoData,
  totalSupply,
  delegatedSupply,
  daoConfig,
}: {
  daoData?: { quorum?: string } | null;
  totalSupply?: string;
  delegatedSupply: { data?: { currentDelegatedSupply?: string } | null };
  daoConfig: DaoConfiguration;
}) => {
  return useMemo(() => {
    const quorumValue = daoData?.quorum ? Number(daoData.quorum) / 1e18 : null;
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

    const usesLiteralQuorumText =
      daoConfig.daoOverview.rules?.quorumCalculation ===
        QUORUM_CALCULATION_TYPES.OBOL ||
      daoConfig.daoOverview.rules?.quorumCalculation ===
        QUORUM_CALCULATION_TYPES.SCROLL;

    const quorumPercentage =
      daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
        ? quorumPercentageDelSupply
        : usesLiteralQuorumText
          ? `(${daoConfig.daoOverview.rules.quorumCalculation})`
          : quorumPercentageTotalSupply;

    const quorumValueFormatted =
      daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
        ? quorumValueDelSupply
        : quorumValueTotalSupply;

    return {
      quorumValue,
      quorumValueFormatted,
      quorumPercentage,
    };
  }, [
    daoData?.quorum,
    totalSupply,
    delegatedSupply.data?.currentDelegatedSupply,
    daoConfig,
  ]);
};
