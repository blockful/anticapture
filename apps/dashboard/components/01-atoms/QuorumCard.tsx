"use client";

import { UsersIcon, Skeleton } from "@/components/01-atoms";
import { formatNumberUserReadble } from "@/lib/client/utils";
import { formatEther } from "viem";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { BaseCardDao, CardData } from "./BaseCardDao";

export const QuorumCard = () => {
  const { daoData } = useDaoDataContext();

  if (!daoData) {
    return <Skeleton />;
  }

  const quorumMinPercentage =
    daoData.quorum &&
    daoData.totalSupply &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) / BigInt(daoData.totalSupply),
    );

  const proposalThresholdPercentage =
    daoData.proposalThreshold &&
    daoData.totalSupply &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(daoData.totalSupply),
    );

  const quorumValue = daoData.quorum
    ? `${formatNumberUserReadble(Number(daoData.quorum) / 10 ** 18)} `
    : "No Quorum";

  const quorumPercentage = quorumMinPercentage
    ? `(${quorumMinPercentage.toString()}%)`
    : "(N/A)";

  const proposalThresholdValue = daoData.proposalThreshold
    ? `${formatNumberUserReadble(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const proposalThresholdPercentageFormatted = proposalThresholdPercentage
    ? `(${proposalThresholdPercentage.toString()}%)`
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
        items: [{ type: "text", label: "For", value: "" }],
      },
      {
        title: "Quorum",
        tooltip:
          "A proposal must meet or exceed a minimum vote threshold (quorum) to pass. Even with majority approval, it fails if it doesn’t reach quorum.",
        items: [
          {
            type: "text",
            value: `${quorumValue} ${daoData.id || "Unknown ID"} ${quorumPercentage}`,
          },
        ],
      },
      {
        title: "Proposal Threshold",
        tooltip:
          "The minimum voting power required to submit an on-chain proposal.",
        items: [
          {
            type: "text",
            value: proposalThresholdText,
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={quorumData} />;
};
