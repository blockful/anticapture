"use client";

import {
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
} from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils/";
import { formatEther } from "viem";
import { useDaoDataContext } from "@/shared/contexts";
import { TextCardDaoInfoItem } from "@/features/dao-overview/components";
import { UsersIcon } from "@/shared/components/icons";
import { useTokenDistributionContext } from "@/features/token-distribution/contexts";
export const QuorumCard = () => {
  const { daoData } = useDaoDataContext();
  const { totalSupply } = useTokenDistributionContext();
  if (!daoData) {
    return <SkeletonDaoInfoCards />;
  }

  const quorumMinPercentage =
    daoData.quorum &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const proposalThresholdPercentage =
    daoData.proposalThreshold &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupply.value ?? ("1" as string)),
    );

  const quorumValue = daoData.quorum
    ? `${formatNumberUserReadable(Number(daoData.quorum) / 10 ** 18)} `
    : "No Quorum";

  const quorumPercentage = quorumMinPercentage
    ? `(${parseFloat(quorumMinPercentage).toFixed(1)}%)`
    : "(N/A)";

  const proposalThresholdValue = daoData.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `(${parseFloat(proposalThresholdPercentage).toFixed(1)}%)`
    : "(N/A)";

  const proposalThresholdText = `${proposalThresholdValue} ${daoData.id || "Unknown ID"} ${proposalThresholdPercentageFormatted}`;

  const quorumData: CardData = {
    title: "Quorum",
    icon: <UsersIcon className="text-foreground" />,
    optionalHeaderValue: (
      <p className="flex text-sm text-tangerine">
        {quorumValue} {daoData.id || "Unknown ID"} {quorumPercentage}
      </p>
    ),
    sections: [
      {
        title: "Logic",
        tooltip:
          'Specifies whether quorum is calculated based on "For" votes, "For + Abstain" votes, or all votes cast',
        items: [
          <TextCardDaoInfoItem
            key="text-logic"
            item={{ label: "For + Abstain" }}
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
            item={{ value: proposalThresholdText, daoId: daoData.id }}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={quorumData} />;
};
