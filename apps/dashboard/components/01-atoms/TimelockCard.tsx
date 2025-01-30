"use client";

import {
  Badge,
  BaseCard,
  Switcher,
  LockIcon,
  ExternalLinkIcon,
  TooltipInfo,
} from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

export const TimelockCard = ({ daoConstants }:{daoConstants: DaoConstants}) => {
  return (
    <BaseCard title="Timelock" icon={<LockIcon />}>
      {/* Timelock Section */}
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">Timelock</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex h-full w-full justify-between gap-1.5">
          <Switcher switched={daoConstants.rules.timelock}/>
          <button
            className="flex h-full w-full"
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.timelock)
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
            <Switcher switched={daoConstants.rules.cancelFunction}/>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};
