"use client";

import { UsersIcon, TooltipInfo } from "@/components/01-atoms";

export const QuorumCard = () => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <UsersIcon />
        <h1 className="card-header-about-text">Quorum</h1>
      </div>
      <div className="card-body-about">
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Logic</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full items-center justify-start gap-1.5">
            <div className="flex w-1/2">
              <p className="flex text-sm font-medium leading-tight">
                For + Abstain
              </p>
            </div>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Proposal threshold</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full items-center justify-start gap-1.5">
            <div className="flex w-1/2">
              <p className="flex text-sm font-medium leading-tight">5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
