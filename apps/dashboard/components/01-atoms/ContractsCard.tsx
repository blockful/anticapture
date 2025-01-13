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

export const ContractsCard = () => {
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
              window.open(
                "https://etherscan.io/address/0x408ED6354d4973f66138C91495F2f2FCbd8724C3#code",
                "_blank",
                "noopener,noreferrer",
              )
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
              window.open(
                "https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                "_blank",
                "noopener,noreferrer",
              )
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
                "https://snapshot.box/#/s:uniswapgovernance.eth",
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
              window.open(
                "https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                "_blank",
                "noopener,noreferrer",
              )
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
