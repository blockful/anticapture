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
import { calculateChangeRate } from "@/features/token-distribution/contexts";
import { Clock, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoData, useTimeSeriesData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums";

export const QuorumCard = () => {
  const { daoId }: { daoId: string } = useParams();
  const { data: daoData, loading: isDaoDataLoading } = useDaoData(
    daoId.toUpperCase() as DaoIdEnum,
  );

  const { data: timeSeriesData, isLoading: isTimeSeriesDataLoading } =
    useTimeSeriesData(
      daoId.toUpperCase() as DaoIdEnum,
      [MetricTypesEnum.TOTAL_SUPPLY],
      TimeInterval.ONE_YEAR,
    );

  let loading = isDaoDataLoading || isTimeSeriesDataLoading;

  const totalSupply = {
    value: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
    ),
  };

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

  const proposalThresholdPercentage =
    daoData?.proposalThreshold &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const quorumValue = daoData?.quorum
    ? `${formatNumberUserReadable(Number(daoData.quorum) / 10 ** 18)} `
    : "No Quorum";

  const quorumPercentage = quorumMinPercentage
    ? `(${parseFloat(quorumMinPercentage).toFixed(1)}%)`
    : "(N/A)";

  const proposalThresholdValue = daoData?.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `(${parseFloat(proposalThresholdPercentage).toFixed(1)}%)`
    : "(N/A)";

  const proposalThresholdText = `${proposalThresholdValue} ${daoData?.id || "Unknown ID"} ${proposalThresholdPercentageFormatted}`;

  const quorumData: CardData = {
    title: "Quorum",
    icon: <Users className="text-secondary size-4" />,
    optionalHeaderValue: daoData && (
      <p className="text-link flex text-sm">
        {quorumValue} {daoData?.id || "Unknown ID"} {quorumPercentage}
      </p>
    ),
    sections: [
      {
        title: "Logic",
        tooltip:
          'Specifies whether quorum is calculated based on "For" votes, "For + Abstain" votes, or all votes cast',
        items: daoData
          ? [
              <TextCardDaoInfoItem
                key="text-logic"
                item={{ label: "For + Abstain" }}
              />,
            ]
          : [
              <Badge className="text-gray-500" key={"hello2"}>
                <Clock className="size-3.5 text-gray-500" />
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
                item={{ value: proposalThresholdText, daoId: daoData.id }}
              />,
            ]
          : [
              <Badge className="text-gray-500" key={"hello2"}>
                <Clock className="size-3.5 text-gray-500" />
                Research pending
              </Badge>,
            ],
      },
    ],
  };

  return <BaseCardDaoInfo data={quorumData} />;
};
