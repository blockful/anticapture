"use client";

import { CircleSlash, Hammer } from "lucide-react";
import { ElementType, useMemo } from "react";

import { MultilineChartAttackProfitability } from "@/features/attack-profitability/components";
import { OverviewMetric } from "@/features/dao-overview/components/OverviewMetric";
import { BlankSlate, TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

const METRICS_SCHEMA = {
  all: { label: "Treasury", color: "#4ade80" },
  delegated: { label: "Cost", color: "#f87171" },
} as const;

type Props = {
  daoId: DaoIdEnum;
};

export const AttackProfitabilityChartCard = ({ daoId }: Props) => {
  const featureNotIncluded =
    !daoConfig[daoId].attackProfitability?.supportsLiquidTreasuryCall;

  const controlledByMultisig = false;
  // const controlledByMultisig = daoId === DaoIdEnum.OPTIMISM;

  const emptyState = controlledByMultisig
    ? {
        icon: CircleSlash,
        title: "Not applicable for this DAO",
        text: "The treasury is controlled by a multisig, not executed automatically by governance. Since proposals can’t directly move funds, attacks that try to profit by draining the treasury don’t apply.",
      }
    : {
        icon: Hammer,
        title: "This data isn’t available yet",
        text: "We’re actively working to bring this data online. Community support helps us prioritize and deliver it faster.",
      };

  const filterData = useMemo(
    () => Object.keys(METRICS_SCHEMA) as Array<keyof typeof METRICS_SCHEMA>,
    [],
  );

  const metrics = useMemo(() => Object.values(METRICS_SCHEMA), []);

  return (
    <div className="lg:bg-surface-default flex w-full flex-col gap-4 px-5 lg:p-4">
      <CardHeader daoId={daoId} disabled={featureNotIncluded} />

      {featureNotIncluded ? (
        <EmptyState {...emptyState} />
      ) : (
        <div className="flex flex-col gap-4">
          <MultilineChartAttackProfitability
            days={TimeInterval.ONE_YEAR}
            filterData={filterData}
            context="overview"
          />

          <div className="flex h-min gap-3">
            {metrics.map(({ label, color }) => (
              <OverviewMetric key={label} label={label} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CardHeader = ({
  daoId,
  disabled,
}: {
  daoId: DaoIdEnum;
  disabled: boolean;
}) => (
  <div className="flex h-5 items-center gap-2">
    {disabled ? (
      <span className="text-primary border-border-contrast border-b border-dashed font-mono text-[13px] font-medium tracking-wider">
        ATTACK PROFITABILITY
      </span>
    ) : (
      <DefaultLink
        href={`/${daoId.toLowerCase()}/attack-profitability`}
        openInNewTab={false}
        className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
      >
        ATTACK PROFITABILITY
      </DefaultLink>
    )}

    <TooltipInfo text="Takes into account the maximum cost and the minimum profit possible. If it looks bad, it’s bad. If it looks good, it’s better, but it does not represent 100% safety. Remember that both getting votes and causing damage can take other formats beyond direct buying and selling assets." />
  </div>
);

const EmptyState = ({
  icon,
  title,
  text,
}: {
  icon: ElementType;
  title: string;
  text: string;
}) => (
  <BlankSlate
    description={text}
    icon={icon}
    title={title}
    variant="title"
    className="h-full"
  />
);
