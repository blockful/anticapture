"use client";

import {
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
} from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils/";
import { formatEther } from "viem";
import { TextCardDaoInfoItem } from "@/features/dao-overview/components";
import { Badge, Clock, Users } from "lucide-react";
import { calculateChangeRate } from "@/features/token-distribution/utils";
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
      TimeInterval.SEVEN_DAYS,
    );

  if (isDaoDataLoading || isTimeSeriesDataLoading) {
    return <SkeletonDaoInfoCards />;
  }

  if (!daoData) {
    return (
      <BaseCardDaoInfo
        data={{
          title: "Quorum",
          icon: <Users className="text-secondary size-4" />,
          sections: [
            {
              title: "Logic",
              tooltip:
                'Specifies whether quorum is calculated based on "For" votes, "For + Abstain" votes, or all votes cast',
              items: [
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
              items: [
                <Badge className="text-secondary" key={"hello2"}>
                  <Clock className="text-secondary size-3.5" />
                  Research pending
                </Badge>,
              ],
            },
          ],
        }}
      />
    );
  }

  const totalSupply = {
    value: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
    ),
  };

  const delSupply = {
    value: timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
    ),
  };

  const delegatedSupply =
    delSupply.value && formatEther(BigInt(delSupply.value));

  const quorumMinPercentage =
    daoData.quorum &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const quorumMinPercentageDelSupply =
    delegatedSupply &&
    delSupply.value !== undefined &&
    formatEther(
      (BigInt(delegatedSupply) * BigInt(30) * BigInt(1e18)) / BigInt(100),
    );

  const quorumValueTotalSupply = daoData.quorum
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
    daoConfig.daoOverview.rules.quorumCalculation === "Del. Supply"
      ? quorumPercentageDelSupply
      : quorumPercentageTotalSupply;

  const quorumValue =
    daoConfig.daoOverview.rules.quorumCalculation === "Del. Supply"
      ? quorumValueDelSupply
      : quorumValueTotalSupply;

  const quorumData: CardData = {
    title: "Quorum",
    icon: <Users className="text-secondary size-4" />,
    optionalHeaderValue: (
      <p className="text-link flex text-xs font-medium">
        {quorumValue} {daoData.id} {quorumPercentage}
      </p>
    ),
    sections: [
      {
        title: "Logic",
        tooltip:
          'Specifies whether quorum is calculated based on "For" votes, "For + Abstain" votes, or all votes cast',
        items: [
          <TextCardDaoInfoItem
            className="items-center"
            key="text-logic"
            item={{
              label: daoConfig.daoOverview.rules.logic,
            }}
          />,
        ],
      },
      {
        title: "Proposal Threshold",
        tooltip:
          "The minimum voting power required to submit an on-chain proposal.",
        items: [
          <TextCardDaoInfoItem
            key="text-proposal-threshold"
            item={{
              value: daoConfig.daoOverview.rules.proposalThreshold,
              daoId: daoData.id as DaoIdEnum,
            }}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={quorumData} />;
};
