"use client";

import {
  Badge,
  BaseCard,
  CrownIcon,
  TokensIcon,
  NewspaperIcon,
  FocusIcon,
  TooltipInfo,
  ExternalLinkIcon,
} from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

export const ContractsCard = ({ daoConstants }:{daoConstants: DaoConstants}) => {
  return (
    <BaseCard title="Contracts" icon={<NewspaperIcon />}>
      {/* Onchain Governance Section */}
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">Onchain Gov</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex h-full w-full justify-between gap-2">
          <button
            className="flex h-full w-full"
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.governor)
            }
          >
            <Badge className="h-full w-full hover:border-lightDark hover:bg-transparent">
              <CrownIcon />
              <p className="text-sm font-medium leading-tight">Governor</p>
              {/* <ExternalLinkIcon /> */}
            </Badge>
          </button>
          <button
            className="flex h-full w-full"
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.token)
            }
          >
            <Badge className="h-full w-full hover:border-lightDark hover:bg-transparent">
              <TokensIcon />
              <p className="text-sm font-medium leading-tight">Token</p>
              {/* <ExternalLinkIcon /> */}
            </Badge>
          </button>
        </div>
      </div>

      {/* Offchain Governance Section */}
      <div className="card-description-about">
        <div className="card-description-title">
          <h1 className="text-foreground">OffChain Gov</h1>
          <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
        </div>
        <div className="flex h-full w-full justify-between gap-2">
          <button
            className="flex h-full w-full"
            onClick={() =>
              window.open(
                daoInfo.snapshot,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Badge className="h-full w-full hover:border-lightDark hover:bg-transparent">
              <FocusIcon />
              <p className="text-sm font-medium leading-tight">Snapshot</p>
              {/* <ExternalLinkIcon /> */}
            </Badge>
          </button>
          <button
            className="flex h-full w-full"
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.token)
            }
          >
            <Badge className="h-full w-full hover:border-lightDark hover:bg-transparent">
              <TokensIcon />
              <p className="text-sm font-medium leading-tight">Token</p>
              {/* <ExternalLinkIcon /> */}
            </Badge>
          </button>
        </div>
      </div>
    </BaseCard>
  );
};
