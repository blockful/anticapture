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
        tooltip: "Direct liquid profit: Cost of direct capture",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.delay,
          },
          {
            type: "badge",
            label: `${formatTimestampUserReadable(daoData.votingDelay)}`,
            icon: <BlocksIcon />,
          },
        ],
      },
      {
        title: "Change Vote",
        tooltip: "Direct liquid profit: Cost of direct capture",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.changeVote,
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={voteData} />;
};
