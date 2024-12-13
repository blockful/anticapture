"use client";

import {
  Badge,
  BlocksIcon,
  ClickIcon,
  Switcher,
  TooltipInfo,
} from "@/components/01-atoms";
import { DAO } from "@/lib/server/backend";

export const VoteCard = ({ daoData }: { daoData: DAO }) => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <ClickIcon />
        <h1 className="card-header-about-text">Vote</h1>
      </div>
      <div className="card-body-about">
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Delay</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full justify-between gap-1.5">
            <Switcher />
            <div className="flex h-full w-full">
              <Badge className="w-full">
                <BlocksIcon />
                <p className="text-sm font-medium leading-tight">
                  {/* {daoData.votingDelay} seconds */}
                  21 blocks
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
              <Switcher />
            </div>
          </div>
        </div>
      </div>
      <div />
    </div>
  );
};
