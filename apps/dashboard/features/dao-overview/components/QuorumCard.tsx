"use client";

import { BaseCardDaoInfo, SkeletonDaoInfoCards } from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils/";
import { TextCardDaoInfoItem } from "@/features/dao-overview/components";
import { Badge, Clock, Users } from "lucide-react";
import { useParams } from "next/navigation";
import {
  useDaoData,
  useDelegatedSupply,
  useTimeSeriesData,
} from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums";
import daoConfigByDaoId from "@/shared/dao-config";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";

const NOT_APPLICABLE = "(N/A)";

const toTokenAmount = (wei: string | bigint) => Number(wei) / 1e18;

const calculatePercentage = (n: string | bigint, d: string | bigint) => {
  return (Number(n) * 100) / Number(d);
};

const resolveQuorum = (
  quorum: string | bigint,
  totalSupply: string | null | undefined,
  quorumCalculation: string | null | undefined,
  delegatedSupply: string | null | undefined,
): { value: string; percentage: string } => {
  const noQuorum = { value: "No Quorum", percentage: NOT_APPLICABLE };
  const calculable = quorum && totalSupply;

  switch (quorumCalculation) {
    case QUORUM_CALCULATION_TYPES.DELEGATE_SUPPLY: {
      // Optimism: 30% of delegate supply
      if (delegatedSupply) {
        const delSupplyTokens = toTokenAmount(delegatedSupply);
        const quorumTokens = delSupplyTokens * 0.3;
        return {
          value: `${formatNumberUserReadable(quorumTokens)} `,
          percentage: `(30% ${quorumCalculation})`,
        };
      }
      break;
    }
    case QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY: {
      // ETH: Simple total supply percentage
      if (calculable) {
        const quorumTokens = toTokenAmount(quorum);
        const percentage = calculatePercentage(quorum, totalSupply);
        return {
          value: `${formatNumberUserReadable(quorumTokens)} `,
          percentage: `(${percentage.toFixed(1)}% ${quorumCalculation})`,
        };
      }
      break;
    }
    case QUORUM_CALCULATION_TYPES.SCROLL || QUORUM_CALCULATION_TYPES.OBOL: {
      // SCROLL: Quorum fixed at 0.21% total $SCR
      // OBOL: Quorum fixed at 0.84% total $OBOL
      if (calculable) {
        return {
          value: `${formatNumberUserReadable(toTokenAmount(quorum))} `,
          percentage: `(${quorumCalculation})`,
        };
      }
      break;
    }
    default:
      return noQuorum;
  }

  return noQuorum;
};

const resolveProposalThreshold = (
  proposalThreshold: string | bigint,
  totalSupply: string | null | undefined,
): { value: string; percentage: string } => {
  if (proposalThreshold && totalSupply) {
    const thresholdTokens = toTokenAmount(proposalThreshold);
    const percentage = calculatePercentage(proposalThreshold, totalSupply);
    return {
      value: formatNumberUserReadable(thresholdTokens),
      percentage: `(${percentage.toFixed(1)}%)`,
    };
  } else {
    return {
      value: "No Threshold",
      percentage: NOT_APPLICABLE,
    };
  }
};

export const QuorumCard = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data: daoData, loading: isDaoDataLoading } = useDaoData(daoIdEnum);
  const daoConfig = daoConfigByDaoId[daoIdEnum];
  const { logic, proposalThreshold } = daoConfig.daoOverview.rules;

  const { data: timeSeriesData, isLoading: isTimeSeriesDataLoading } =
    useTimeSeriesData(
      daoIdEnum,
      [MetricTypesEnum.TOTAL_SUPPLY],
      TimeInterval.SEVEN_DAYS,
    );

  const { data: delegatedSupply } = useDelegatedSupply(
    daoIdEnum,
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

  const totalSupply =
    timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null;

  const { value: quorumValue, percentage: quorumPercentage } = resolveQuorum(
    daoData?.quorum,
    totalSupply,
    daoConfig.daoOverview.rules?.quorumCalculation,
    delegatedSupply?.currentDelegatedSupply,
  );

  const {
    value: proposalThresholdValue,
    percentage: proposalThresholdPercentageFormatted,
  } = resolveProposalThreshold(daoData?.proposalThreshold, totalSupply);

  const proposalThresholdText = `${proposalThresholdValue} ${daoData?.id || "Unknown ID"} ${proposalThresholdPercentageFormatted}`;
  const textCardDaoInfo = proposalThreshold ?? proposalThresholdText;

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
                  value: textCardDaoInfo,
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
