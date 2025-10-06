"use client";

import {
  Badge,
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
} from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils/";
import { TextCardDaoInfoItem } from "@/features/dao-overview/components";
import {
  calculateChangeRate,
  useTokenDistributionContext,
} from "@/features/token-distribution/contexts";
import { Clock, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoData, useTimeSeriesData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums";
import daoConfigByDaoId from "@/shared/dao-config";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";

const toTokenAmount = (wei: string | bigint) => Number(wei) / 1e18;

const calculatePercentage = (n: string | bigint, d: string | bigint) => {
  return (Number(n) * 100) / Number(d);
};

export const QuorumCard = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data: daoData, loading: isDaoDataLoading } = useDaoData(daoIdEnum);
  const daoConfig = daoConfigByDaoId[daoIdEnum];
  const { delegatedSupply } = useTokenDistributionContext();

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

  if (loading) {
    return <SkeletonDaoInfoCards />;
  }

  // Helper functions

  // Determine calculation type
  const isDelSupplyBased =
    daoConfig.daoOverview.rules?.quorumCalculation ===
    QUORUM_CALCULATION_TYPES.DELEGATE_SUPPLY;

  // Calculate quorum values and percentages
  let quorumValue: string;
  let quorumPercentage: string;

  if (isDelSupplyBased && delegatedSupply.value) {
    const delSupplyTokens = toTokenAmount(delegatedSupply.value);
    const quorumTokens = delSupplyTokens * 0.3;
    quorumValue = `${formatNumberUserReadable(quorumTokens)} `;
    quorumPercentage = `(30% ${daoConfig.daoOverview.rules?.quorumCalculation})`;
  } else if (daoData?.quorum && totalSupply.value) {
    const quorumTokens = toTokenAmount(daoData.quorum);
    const percentage = calculatePercentage(daoData.quorum, totalSupply.value);
    quorumValue = `${formatNumberUserReadable(quorumTokens)} `;
    quorumPercentage = `(${percentage.toFixed(1)}% ${daoConfig.daoOverview.rules?.quorumCalculation})`;
  } else {
    quorumValue = "No Quorum";
    quorumPercentage = "(N/A)";
  }

  // Calculate proposal threshold
  let proposalThresholdValue: string;
  let proposalThresholdPercentageFormatted: string;

  if (daoData?.proposalThreshold && totalSupply.value) {
    const thresholdTokens = toTokenAmount(daoData.proposalThreshold);
    const percentage = calculatePercentage(
      daoData.proposalThreshold,
      totalSupply.value,
    );
    proposalThresholdValue = formatNumberUserReadable(thresholdTokens);
    proposalThresholdPercentageFormatted = `(${percentage.toFixed(1)}%)`;
  } else {
    proposalThresholdValue = "No Threshold";
    proposalThresholdPercentageFormatted = "(N/A)";
  }

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
