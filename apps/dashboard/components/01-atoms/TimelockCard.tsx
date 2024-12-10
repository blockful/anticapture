"use client";

import {
  Badge,
  InfoIcon,
  Switcher,
  LockIcon,
  ExternalLinkIcon,
} from "@/components/01-atoms";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";

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
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="m-1 border-foreground bg-dark">
                <p className="text-white">
                  Direct liquid profit: Cost of direct capture
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex w-full justify-between gap-1.5">
            <Switcher />
            <button className="flex h-full w-full">
              <Badge className="h-full px-2.5">
                <p className="text-sm font-medium leading-tight">View</p>
                <ExternalLinkIcon />
              </Badge>
            </button>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Cancel function</h1>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="m-1 border-foreground bg-dark">
                <p className="text-white">
                  Direct liquid profit: Cost of direct capture
                </p>
              </TooltipContent>
            </Tooltip>
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
