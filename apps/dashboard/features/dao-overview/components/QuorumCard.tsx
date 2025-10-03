"use client";

import {
  Badge,
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
} from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils/";
import { formatEther } from "viem";
import { TextCardDaoInfoItem } from "@/features/dao-overview/components";
import { calculateChangeRate } from "@/features/token-distribution/utils";
import { Clock, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoData, useTimeSeriesData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums";
import daoConfigByDaoId from "@/shared/dao-config";

export const QuorumCard = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data: daoData, loading: isDaoDataLoading } = useDaoData(daoIdEnum);
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  const { data: timeSeriesData, isLoading: isTimeSeriesDataLoading } =
    useTimeSeriesData(
      daoIdEnum,
      [MetricTypesEnum.TOTAL_SUPPLY],
      TimeInterval.ONE_YEAR,
    );

  const loading = isDaoDataLoading || isTimeSeriesDataLoading;

  const totalSupply = {
    value: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
    ),
  };

  const delSupply = {
    value:
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high ?? null,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
    ),
  };

  const delegatedSupplyValueOp = delSupply.value
    ? String(BigInt(delSupply.value) / BigInt(10 ** 18))
    : delSupply.value;

  if (loading) {
    return <SkeletonDaoInfoCards />;
  }

  const quorumMinPercentage =
    daoData?.quorum &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const quorumMinPercentageDelSupply =
    delegatedSupplyValueOp &&
    delSupply.value !== undefined &&
    formatEther(
      (BigInt(delegatedSupplyValueOp) * BigInt(30) * BigInt(1e18)) /
        BigInt(100),
    );

  const proposalThresholdPercentage =
    daoData?.proposalThreshold &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const quorumValueTotalSupply = daoData?.quorum
    ? `${formatNumberUserReadable(Number(daoData.quorum) / 10 ** 18)} `
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

  const quorumValue =
    daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
      ? quorumValueDelSupply
      : quorumValueTotalSupply;

  const proposalThresholdValue = daoData?.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `(${parseFloat(proposalThresholdPercentage).toFixed(1)}%)`
    : "(N/A)";

  const proposalThresholdText = `${proposalThresholdValue} ${daoData?.id || "Unknown ID"} ${proposalThresholdPercentageFormatted}`;

  const textCardDaoInfo =
    daoConfig.daoOverview.rules?.proposalThreshold ?? proposalThresholdText;

  const quorumData: CardData = {
    title: "Quorum",
    icon: <Users className="text-secondary size-4" />,
    optionalHeaderValue: daoData && (
      <p className="text-link flex text-xs font-medium">
        {quorumValue} {daoData?.id || "Unknown ID"} {quorumPercentage}
      </p>
    ),
    sections: [
      {
        title: "Logic",
        tooltip:
          'Specifies whether quorum is calculated based on "For" votes, "For + Abstain" votes, or all votes cast',
        items:
          daoData && daoConfig.daoOverview.rules?.logic
            ? [
                <TextCardDaoInfoItem
                  className="items-center"
                  key="text-logic"
                  item={{
                    label: daoConfig.daoOverview.rules.logic,
                  }}
                />,
              ]
            : [
                <Badge className="text-secondary" key={"hello2"}>
                  <Clock className="text-secondary size-3.5" />
                  Research pending
                </Badge>,
              ],
      },
      {
        title: "Proposal Threshold",
        tooltip:
          "The minimum voting power required to submit an on-chain proposal.",
        items: daoData
          ? [
              <TextCardDaoInfoItem
                key="text-proposal-threshold"
                item={{
                  value: textCardDaoInfo,
                  daoId: daoData.id as DaoIdEnum,
                }}
              />,
            ]
          : [
              <Badge className="text-secondary" key={"hello2"}>
                <Clock className="text-secondary size-3.5" />
                Research pending
              </Badge>,
            ],
      },
    ],
  };

  return <BaseCardDaoInfo data={quorumData} />;
};
