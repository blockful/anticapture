"use client";

import { BaseCardDaoInfo, SkeletonDaoInfoCards } from "@/shared/components";
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
  const { quorumCalculation, logic, proposalThreshold } =
    daoConfig.daoOverview.rules;

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
  }?.value;

  const delSupply = {
    value: timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high,
    changeRate: calculateChangeRate(
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
    ),
  }?.value;

  const delegatedSupply = delSupply && formatEther(BigInt(delSupply));

  const quorumMinPercentage =
    totalSupply &&
    formatEther((BigInt(daoData.quorum) * BigInt(1e20)) / BigInt(totalSupply));

  const quorumMinPercentageDelSupply =
    delegatedSupply &&
    delSupply &&
    formatEther(
      (BigInt(delegatedSupply) * BigInt(30) * BigInt(1e18)) / BigInt(100),
    );

  const quorumValueTotalSupply = daoData.quorum
    ? `${formatNumberUserReadable(Number(formatEther(daoData.quorum)))} `
    : "No Quorum";

  const quorumValueDelSupply = quorumMinPercentageDelSupply
    ? `${formatNumberUserReadable(parseFloat(quorumMinPercentageDelSupply))} `
    : "No Quorum";

  const quorumPercentageDelSupply = quorumMinPercentageDelSupply
    ? `(30% ${quorumCalculation})`
    : "(N/A)";

  const quorumPercentageTotalSupply = quorumMinPercentage
    ? `(${parseFloat(quorumMinPercentage).toFixed(1)}% ${quorumCalculation})`
    : "(N/A)";

  const quorumPercentage =
    quorumCalculation === "Del. Supply"
      ? quorumPercentageDelSupply
      : quorumPercentageTotalSupply;

  const quorumValue =
    quorumCalculation === "Del. Supply"
      ? quorumValueDelSupply
      : quorumValueTotalSupply;

  return (
    <BaseCardDaoInfo
      data={{
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
                  label: logic,
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
                  value: proposalThreshold,
                  daoId: daoIdEnum,
                }}
              />,
            ],
          },
        ],
      }}
    />
  );
};
