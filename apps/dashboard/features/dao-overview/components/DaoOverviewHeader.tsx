import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { EthereumIcon } from "@/shared/components/icons/EthereumIcon";
import { DollarSign } from "lucide-react";
import { DaoConfiguration, DaoOverviewConfig } from "@/shared/dao-config/types";

interface DaoOverviewHeaderProps {
  daoId: string;
  daoConfig: DaoConfiguration;
  daoOverview: DaoOverviewConfig;
  lastPrice: number;
}

export const DaoOverviewHeader = ({
  daoId,
  daoConfig,
  daoOverview,
  lastPrice,
}: DaoOverviewHeaderProps) => {
  const baseLinkRoute = `${daoOverview.chain.blockExplorers?.default.url}/address`;

  return (
    <div className="bg-border-default flex items-center gap-3 px-4 py-2.5">
      <h3 className="text-primary text-lg font-medium uppercase leading-6">
        {daoConfig.name}
      </h3>
      <BadgeStatus
        icon={EthereumIcon}
        className="bg-surface-opacity text-primary h-5 rounded-full text-xs"
      >
        Ethereum
      </BadgeStatus>
      <BadgeStatus
        icon={DollarSign}
        iconVariant="secondary"
        className="bg-surface-opacity text-primary h-5 rounded-full text-xs"
      >
        1 {daoId} = ${lastPrice.toFixed(2)}
      </BadgeStatus>

      <div className="ml-auto flex items-center gap-2">
        <DefaultLink
          href={`${baseLinkRoute}/${daoOverview.contracts?.governor}`}
          openInNewTab
          className="after:text-border-contrast text-xs uppercase after:content-['•']"
        >
          Governor
        </DefaultLink>
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
          className="after:text-border-contrast text-xs uppercase after:content-['•']"
        >
          Token
        </DefaultLink>
        <DefaultLink
          href={`${baseLinkRoute}/${daoOverview.contracts?.governor}`}
          openInNewTab
          className="text-xs uppercase"
        >
          Forum
        </DefaultLink>
      </div>
    </div>
  );
};
