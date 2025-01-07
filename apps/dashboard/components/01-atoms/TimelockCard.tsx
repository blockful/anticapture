"use client";

import {
  Badge,
  Switcher,
  LockIcon,
  ExternalLinkIcon,
  TooltipInfo,
} from "@/components/01-atoms";
import { BaseCard } from "@/components/01-atoms/BaseCard";

export const TimelockCard = () => {
  return (
    <BaseCard title="Timelock" icon={<LockIcon />}>
      {/* Timelock Section */}
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">Timelock</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex w-full justify-between gap-1.5">
          <Switcher />
          <button
            className="flex h-full w-full"
            onClick={() =>
              window.open(
                "https://etherscan.io/address/0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Badge className="h-full w-full px-2.5 hover:border-lightDark hover:bg-transparent lg:w-fit xl4k:w-full">
              <p className="text-sm font-medium leading-tight">View</p>
              <ExternalLinkIcon />
            </Badge>
          </button>
        </div>
      </div>

      {/* Cancel Function Section */}
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
    </BaseCard>
  );
};
