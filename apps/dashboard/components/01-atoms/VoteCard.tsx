"use client";

import {
  Badge,
  BlocksIcon,
  ClickIcon,
  InfoIcon,
  Switcher,
} from "@/components/01-atoms";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";

export const VoteCard = () => {
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
          <div className="flex h-full w-full justify-between gap-1.5">
            <Switcher />
            <div className="flex h-full w-full">
              <Badge>
                <BlocksIcon />
                <p className="text-sm font-medium leading-tight">2 Blocks</p>
              </Badge>
            </div>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Change vote</h1>
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
      <div />
    </div>
  );
};
