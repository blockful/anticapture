"use client";

import {
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
  SwitchCardDaoInfoItem,
} from "@/shared/components";
import { formatBlocksToUserReadable, formatPlural } from "@/shared/utils/utils";
import { useDaoDataContext } from "@/shared/contexts/DaoDataContext";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useScreenSize } from "@/shared/hooks";
import { BlocksIcon, ClickIcon } from "@/shared/components/icons";
import { BadgeCardDaoInfoItem } from "@/features/dao-overview/components/BadgeCardDaoInfoItem";

export const VoteCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { daoData } = useDaoDataContext();
  const { isMobile } = useScreenSize();

  if (!daoData) {
    return <SkeletonDaoInfoCards />;
  }

  const voteData: CardData = {
    title: "Vote",
    icon: <ClickIcon className="size-4 text-foreground" />,
    sections: [
      {
        title: "Delay",
        tooltip:
          "The voting delay is the number of blocks between an on-chain proposal’s submission and the start of its voting period. It gives DAO members time to discuss and review proposals before voting begins.",
        items: [
          <SwitchCardDaoInfoItem
            key={"switch"}
            switched={daoOverview.rules?.delay}
          />,
          <Tooltip key={"delay-tooltip"}>
            <TooltipTrigger>
              <BadgeCardDaoInfoItem
                className="cursor-default bg-dark text-white sm:bg-lightDark"
                icon={<BlocksIcon />}
                label={
                  isMobile
                    ? formatBlocksToUserReadable(daoData.votingDelay, true)
                    : formatBlocksToUserReadable(daoData.votingDelay, false)
                }
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-md rounded-lg border border-lightDark bg-dark text-center text-white shadow">
              {formatPlural(Number(daoData.votingDelay), "block")}
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
            switched={daoOverview.rules?.changeVote}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={voteData} />;
};
