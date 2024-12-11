"use client";

import {
  Badge,
  CrownIcon,
  TokensIcon,
  NewspaperIcon,
  FocusIcon,
  TooltipInfo,
} from "@/components/01-atoms";

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
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full justify-between gap-2">
            <button className="flex h-full w-full">
              <Badge className="h-full w-full">
                <CrownIcon />
                <p className="text-sm font-medium leading-tight">Governor</p>
              </Badge>
            </button>
            <button className="flex h-full w-full">
              <Badge className="h-full w-full">
                <TokensIcon />
                <p className="text-sm font-medium leading-tight">Token</p>
              </Badge>
            </button>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">OffChain Gov</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full justify-between gap-2">
            <button className="flex h-full w-full">
              <Badge className="h-full w-full">
                <FocusIcon />
                <p className="text-sm font-medium leading-tight">Snapshot </p>
              </Badge>
            </button>
            <button className="flex h-full w-full">
              <Badge className="h-full w-full">
                <TokensIcon />
                <p className="text-sm font-medium leading-tight">Token </p>
              </Badge>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
