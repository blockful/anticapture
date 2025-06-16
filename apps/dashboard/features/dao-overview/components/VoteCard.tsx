"use client";

import {
  Badge,
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
import { Clock, Pointer } from "lucide-react";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";

export const VoteCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { daoId }: { daoId: string } = useParams();
  const { data: daoData, loading } = useDaoData(
    daoId.toUpperCase() as DaoIdEnum,
  );
  const { isMobile } = useScreenSize();

  if (loading) {
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
        items: daoData
          ? [
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
            ]
          : [
              <Badge className="text-gray-500" key={"hello2"}>
                <Clock className="size-3.5 text-gray-500" />
                Research pending
              </Badge>,
            ],
      },
      {
        title: "Change Vote",
        tooltip:
          "Allows voters to alter their vote after it has already been cast.",
        items: daoData
          ? [
              <SwitchCardDaoInfoItem
                key={"switch"}
                switched={daoOverview.rules?.changeVote}
              />,
            ]
          : [
              <Badge className="text-gray-500" key={"hello2"}>
                <Clock className="size-3.5 text-gray-500" />
                Research pending
              </Badge>,
            ],
      },
    ],
  };

  return <BaseCardDaoInfo data={voteData} />;
};
