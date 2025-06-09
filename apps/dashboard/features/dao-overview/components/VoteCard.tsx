"use client";

import {
  BaseCardDaoInfo,
  CardData,
  SkeletonDaoInfoCards,
  SwitchCardDaoInfoItem,
} from "@/shared/components";
import { formatPlural } from "@/shared/utils";
import { formatBlocksToUserReadable } from "@/shared/utils";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useDaoData, useScreenSize } from "@/shared/hooks";
import { BadgeCardDaoInfoItem } from "@/features/dao-overview/components/BadgeCardDaoInfoItem";
import { CubeIcon } from "@radix-ui/react-icons";
import { Pointer } from "lucide-react";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";

export const VoteCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { daoId }: { daoId: string } = useParams();
  const { data: daoData } = useDaoData(daoId.toUpperCase() as DaoIdEnum);
  const { isMobile } = useScreenSize();

  if (!daoData) {
    return <SkeletonDaoInfoCards />;
  }

  const voteData: CardData = {
    title: "Vote",
    icon: <Pointer className="text-secondary size-4" />,
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
                className="bg-surface-default sm:bg-surface-contrast text-primary cursor-default"
                icon={<CubeIcon className="text-link size-3.5" />}
                label={
                  isMobile
                    ? formatBlocksToUserReadable(daoData.votingDelay, true)
                    : formatBlocksToUserReadable(daoData.votingDelay, false)
                }
              />
            </TooltipTrigger>
            <TooltipContent className="border-light-dark bg-surface-default text-primary max-w-md rounded-lg border text-center shadow-sm">
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
