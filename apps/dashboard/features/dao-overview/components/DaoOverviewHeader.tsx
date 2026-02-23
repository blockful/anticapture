import { DollarSign } from "lucide-react";

import { SkeletonRow, TooltipInfo } from "@/shared/components";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { EthereumIcon } from "@/shared/components/icons/EthereumIcon";
import { OPMainnetIcon } from "@/shared/components/icons/OPMainnetIcon";
import { DaoConfiguration, DaoOverviewConfig } from "@/shared/dao-config/types";
import { cn } from "@/shared/utils";

interface DaoOverviewHeaderProps {
  daoId: string;
  daoConfig: DaoConfiguration;
  daoOverview: DaoOverviewConfig;
  lastPrice: number;
  isLoading: boolean;
}

const chainIconsSchema: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  Ethereum: EthereumIcon,
  "OP Mainnet": OPMainnetIcon,
};

export const DaoOverviewHeader = ({
  daoId,
  daoConfig,
  daoOverview,
  lastPrice,
  isLoading,
}: DaoOverviewHeaderProps) => {
  const baseLinkRoute = `${daoOverview.chain.blockExplorers?.default.url}/address`;
  const chainName = daoOverview.chain.name;

  return (
    <div className="lg:bg-border-default flex flex-col gap-3 pb-4 pt-2.5 lg:flex-row lg:items-center lg:justify-between lg:px-4 lg:py-2.5">
      <div className="flex items-center gap-3">
        <h3 className="text-primary font-mono text-lg font-medium uppercase leading-6">
          {daoConfig.name}
        </h3>
        <BadgeStatus
          icon={chainIconsSchema[chainName]}
          className="bg-surface-opacity text-primary h-5 rounded-full text-xs"
        >
          {chainName}
        </BadgeStatus>
        {isLoading ? (
          <SkeletonRow
            parentClassName="flex animate-pulse justify-end w-full"
            className="bg-surface-hover h-5 w-20 rounded-full"
          />
        ) : (
          <BadgeStatus
            icon={DollarSign}
            iconVariant="secondary"
            className="bg-surface-opacity text-primary h-5 rounded-full text-xs"
          >
            1 {daoId} = ${lastPrice.toFixed(2)}
            {daoOverview.priceDisclaimer && (
              <TooltipInfo text={daoOverview.priceDisclaimer} />
            )}
          </BadgeStatus>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DefaultLink
          href={`${baseLinkRoute}/${daoOverview.contracts?.governor}`}
          openInNewTab
          className="after:text-border-contrast text-xs uppercase after:content-['•']"
        >
          Governor
        </DefaultLink>
        {daoOverview.contracts?.timelock && (
          <DefaultLink
            href={`${baseLinkRoute}/${daoOverview.contracts.timelock}`}
            openInNewTab
            className="after:text-border-contrast text-xs uppercase after:content-['•']"
          >
            Timelock
          </DefaultLink>
        )}
        <DefaultLink
          href={daoOverview.snapshot || "#"}
          openInNewTab
          className="after:text-border-contrast text-xs uppercase after:content-['•']"
        >
          Snapshot
        </DefaultLink>
        <DefaultLink
          href={`${baseLinkRoute}/${daoOverview.contracts?.token}`}
          openInNewTab
          className={cn(
            `after:text-border-contrast text-xs uppercase`,
            daoConfig.forumLink && `after:content-['•']`,
          )}
        >
          Token
        </DefaultLink>
        {daoConfig.forumLink && (
          <DefaultLink
            href={daoConfig.forumLink}
            openInNewTab
            className="text-xs uppercase"
          >
            Forum
          </DefaultLink>
        )}
      </div>
    </div>
  );
};
