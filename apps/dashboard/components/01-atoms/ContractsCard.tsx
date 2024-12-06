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
    <div className="flex max-w-[250px] flex-col gap-3 rounded-lg border border-lightDark bg-dark shadow">
      <div
        id="card-header"
        className="flex items-center gap-3 rounded-t-lg border-b border-lightDark px-4 py-3"
      >
        <NewspaperIcon />
        <h1 className="text-base font-normal leading-normal">Contracts</h1>
      </div>
      <div id="card-body" className="flex flex-col gap-4 px-3">
        <div id="card-description" className="flex flex-col gap-2 p-1">
          <div id="title" className="flex items-center gap-1.5">
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
            <button>
              <Badge>
                <CrownIcon /> Governor
              </Badge>
            </button>
            <button>
              <Badge>
                <TokensIcon /> Token
              </Badge>
            </button>
          </div>
        </div>
        <div id="card-description" className="flex flex-col gap-2 p-1">
          <div id="title" className="flex items-center gap-1.5">
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
            <button>
              <Badge>
                <FocusIcon /> Snapshot
              </Badge>
            </button>
            <button>
              <Badge>
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
