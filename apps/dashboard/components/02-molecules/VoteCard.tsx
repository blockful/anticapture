"use client";

import {
  BadgeCardDaoInfoItem,
  BaseCardDaoInfo,
  BlocksIcon,
  CardData,
  ClickIcon,
  Skeleton,
  SwitchCardDaoInfoItem,
} from "@/components/01-atoms";
import { formatBlocksToUserReadable, formatTimeUnit } from "@/lib/client/utils";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { DaoConstants } from "@/lib/dao-constants/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
          <SwitchCardDaoInfoItem
            key={"switch"}
            switched={daoConstants.rules.delay}
          />,
          <Tooltip key={"delay-tooltip"}>
            <TooltipTrigger>
              <BadgeCardDaoInfoItem
                className="cursor-default"
                icon={<BlocksIcon />}
                label={formatBlocksToUserReadable(daoData.votingDelay)}
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-md rounded-lg border border-lightDark bg-dark text-center text-white shadow">
              {formatTimeUnit(Number(daoData.votingDelay), "block")}
            </TooltipContent>
          </Tooltip>,
        ],
      },
      {
        title: "Change Vote",
        tooltip:
          "Allows voters to alter their vote after it has already been cast.",
        items: [
          <SwitchCardDaoInfoItem
            key={"switch"}
            switched={daoConstants.rules.changeVote}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={voteData} />;
};
