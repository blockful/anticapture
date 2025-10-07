import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { EthereumIcon } from "@/shared/components/icons/EthereumIcon";
import { DollarSign } from "lucide-react";
import { DaoConfiguration, DaoOverviewConfig } from "@/shared/dao-config/types";
import { OPMainnetIcon } from "@/shared/components/icons/OPMainnetIcon";
import { ArbitrumIcon } from "@/shared/components/icons";

interface DaoOverviewHeaderProps {
  daoId: string;
  daoConfig: DaoConfiguration;
  daoOverview: DaoOverviewConfig;
  lastPrice: number;
}

const chainIconsSchema: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  Ethereum: EthereumIcon,
  "OP Mainnet": OPMainnetIcon,
  "Arbitrum One": () => <ArbitrumIcon showBackground={false} className="w-4" />,
};

export const DaoOverviewHeader = ({
  daoId,
  daoConfig,
  daoOverview,
  lastPrice,
}: DaoOverviewHeaderProps) => {
  const baseLinkRoute = `${daoOverview.chain.blockExplorers?.default.url}/address`;
  const chainName = daoOverview.chain.name;

  return (
    <div className="md:bg-border-default flex flex-col gap-3 py-2.5 md:flex-row md:items-center md:justify-between md:px-4">
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
        <BadgeStatus
          icon={DollarSign}
          iconVariant="secondary"
          className="bg-surface-opacity text-primary h-5 rounded-full text-xs"
        >
          1 {daoId} = ${lastPrice.toFixed(2)}
        </BadgeStatus>
      </div>

      <div className="flex items-center gap-2">
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
          href={daoConfig.forumLink || "#"}
          openInNewTab
          className="text-xs uppercase"
        >
          Forum
        </DefaultLink>
      </div>
    </div>
  );
};
