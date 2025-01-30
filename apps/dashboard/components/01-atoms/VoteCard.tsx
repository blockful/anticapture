"use client";

import {
  Badge,
  BaseCard,
  BlocksIcon,
  ClickIcon,
  Skeleton,
  Switcher,
  TooltipInfo,
} from "@/components/01-atoms";
import { formatTimestampUserReadable } from "@/lib/client/utils";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { DaoConstants } from "@/lib/dao-constants/types";

export const VoteCard = ({daoConstants}: {daoConstants: DaoConstants}) => {
  const { daoData } = useDaoDataContext();

  if (!daoData) {
    return <Skeleton />;
  }

  return (
    <BaseCard title="Vote" icon={<ClickIcon />}>
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">Delay</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex h-full w-full justify-between gap-1.5">
          <Switcher switched={daoConstants.rules.delay}/>
          <div className="flex h-full w-full">
            <Badge className="w-full">
              <BlocksIcon />
              <p className="text-sm font-medium leading-tight">
                {formatTimestampUserReadable(daoData.votingDelay)}
              </p>
            </Badge>
          </div>
        </div>
      </div>
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">Change vote</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex h-full">
          <div className="flex w-1/2">
            <Switcher switched={daoConstants.rules.changeVote} />
          </div>
        </div>
      </div>
    </BaseCard>
  );
};
