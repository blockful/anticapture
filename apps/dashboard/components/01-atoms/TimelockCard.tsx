"use client";

import {
  Badge,
  Switcher,
  LockIcon,
  ExternalLinkIcon,
  TooltipInfo,
} from "@/components/01-atoms";

export const TimelockCard = () => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <LockIcon />
        <h1 className="card-header-about-text">Timelock</h1>
      </div>
      <div className="card-body-about">
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Timelock</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex w-full justify-between gap-1.5">
            <Switcher />
            <button className="flex h-full w-full">
              <Badge className="h-full w-full px-2.5 lg:w-fit xl4k:w-full">
                <p className="text-sm font-medium leading-tight">View</p>
                <ExternalLinkIcon />
              </Badge>
            </button>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Cancel function</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full">
            <div className="flex w-1/2">
              <Switcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
