"use client";

import {
  BaseCardDaoInfo,
  CardData,
  TextCardDaoInfoItem,
  UsersIcon,
  Skeleton,
} from "@/components/01-atoms";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { formatEther } from "viem";
import {
  useDaoDataContext,
  useTokenDistributionContext,
} from "@/components/contexts";

export const QuorumCard = () => {
  const { daoData } = useDaoDataContext();
  const { totalSupply } = useTokenDistributionContext();
  if (!daoData) {
    return <Skeleton />;
  }

  const quorumMinPercentage =
    daoData.quorum &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) /
        BigInt(totalSupply.value as string),
    );

  const proposalThresholdPercentage =
    daoData.proposalThreshold &&
    totalSupply.value !== undefined &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupply.value as string),
    );

  const quorumValue = daoData.quorum
    ? `${formatNumberUserReadable(Number(daoData.quorum) / 10 ** 18)} `
    : "No Quorum";

  const quorumPercentage = quorumMinPercentage
    ? `(${parseFloat(quorumMinPercentage).toFixed(2)}%)`
    : "(N/A)";

  const proposalThresholdValue = daoData.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `(${parseFloat(proposalThresholdPercentage).toFixed(2)}%)`
    : "(N/A)";

  const proposalThresholdText = `${proposalThresholdValue} ${daoData.id || "Unknown ID"} ${proposalThresholdPercentageFormatted}`;

  const quorumData: CardData = {
    title: "Quorum",
    icon: <UsersIcon />,
    sections: [
      {
        title: "Logic",
        tooltip:
          "Specifies whether quorum is calculated based on “For” votes, “For + Abstain” votes, or all votes cast",
        items: [<TextCardDaoInfoItem label="For" key={"text-logic"} />],
      },
      {
        title: "Quorum",
        tooltip:
          "A proposal must meet or exceed a minimum vote threshold (quorum) to pass. Even with majority approval, it fails if it doesn't reach quorum.",
        items: [
          <TextCardDaoInfoItem
            key={"text-quorum"}
            value={`${quorumValue} ${daoData.id || "Unknown ID"} ${quorumPercentage}`}
          />,
        ],
      },
      {
        title: "Proposal Threshold",
        tooltip:
          "The minimum voting power required to submit an on-chain proposal.",
        items: [
          <TextCardDaoInfoItem
            value={proposalThresholdText}
            key={"text-proposal-threshold"}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={quorumData} />;
};
