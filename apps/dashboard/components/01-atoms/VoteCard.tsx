"use client";

import { BlocksIcon, ClickIcon, Skeleton } from "@/components/01-atoms";
import { formatTimestampUserReadable } from "@/lib/client/utils";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { DaoConstants } from "@/lib/dao-constants/types";
import { BaseCardDao, CardData } from "./BaseCardDao";

export const VoteCard = ({ daoConstants }: { daoConstants: DaoConstants }) => {
  const { daoData } = useDaoDataContext();

  if (!daoData) {
    return <Skeleton />;
  }

  const voteData: CardData = {
    title: "Vote",
    icon: <ClickIcon />,
    sections: [
      {
        title: "Delay",
        tooltip:
          "The voting delay is the number of blocks between an on-chain proposal’s submission and the start of its voting period. It gives DAO members time to discuss and review proposals before voting begins.",
        items: [
          {
            type: "switch",
            switched: daoConstants.rules.delay,
          },
          {
            type: "badge",
            label: formatTimestampUserReadable(daoData.votingDelay),
            icon: <BlocksIcon />,
          },
        ],
      },
      {
        title: "Change Vote",
        tooltip:
          "Allows voters to alter their vote after it has already been cast.",
        items: [
          {
            type: "switch",
            switched: daoConstants.rules.changeVote,
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={voteData} />;
};
