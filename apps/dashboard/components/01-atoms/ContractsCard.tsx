"use client";

import {
  Badge,
  CrownIcon,
  TokensIcon,
  NewspaperIcon,
  FocusIcon,
  InfoIcon,
} from "@/components/01-atoms";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";

export const ContractsCard = () => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <NewspaperIcon />
        <h1 className="card-header-about-text">Contracts</h1>
      </div>
      <div className="card-body-about">
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Onchain Gov</h1>
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
          <div className="flex gap-2">
            <button className="w-full">
              <Badge className="w-full">
                <CrownIcon /> Governor
              </Badge>
            </button>
            <button className="w-full">
              <Badge className="w-full">
                <TokensIcon /> Token
              </Badge>
            </button>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">OffChain Gov</h1>
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
          <div className="flex gap-2">
            <button className="w-full">
              <Badge className="w-full">
                <FocusIcon /> Snapshot
              </Badge>
            </button>
            <button className="w-full">
              <Badge className="w-full">
                <TokensIcon /> Token
              </Badge>
            </button>
          </div>
        </div>
      </div>
      <div />
    </div>
  );
};
