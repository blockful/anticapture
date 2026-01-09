"use client";

import { MultilineChartAttackProfitability } from "@/features/attack-profitability/components";
import { TooltipInfo } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { OverviewMetric } from "@/features/dao-overview/components/OverviewMetric";
import daoConfig from "@/shared/dao-config";
import { CircleSlash2 } from "lucide-react";

const metricsSchema = {
  all: { label: "Treasury", color: "#4ade80" },
  delegated: { label: "Cost", color: "#f87171" },
};

export const AttackProfitabilityChartCard = ({
  daoId,
}: {
  daoId: DaoIdEnum;
}) => {
  const featureNotIncluded = daoConfig[daoId].attackProfitability?.notSupported;

  return (
    <div className="sm:bg-surface-default flex w-full flex-col gap-4 px-5 md:p-4">
      <div className="flex h-5 items-center gap-2">
        <DefaultLink
          href={`${daoId.toLowerCase()}/attack-profitability`}
          openInNewTab={false}
          className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium tracking-wider"
        >
          ATTACK PROFITABILITY
        </DefaultLink>
        <TooltipInfo text="Takes into account the maximum cost and the minimum profit possible. If it looks bad, it’s bad. If it looks good, it’s better, but it does not represent 100% safety. Remember that both getting votes and causing damage can take other formats beyond direct buying and selling assets." />
      </div>
      {featureNotIncluded ? (
        <div className="bg-surface-contrast flex h-full flex-col items-center justify-center px-3 py-4 text-center">
          <CircleSlash2 className="text-secondary mb-2.5" />
          <span className="text-primary font-mono text-[13px] font-medium uppercase tracking-wider">
            Not applicable for this DAO
          </span>
          <p className="text-secondary text-sm">
            The treasury is controlled by a multisig, not executed automatically
            by governance. Since proposals can’t directly move funds, attacks
            that try to profit by draining the treasury don’t apply.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <MultilineChartAttackProfitability
            days={TimeInterval.ONE_YEAR}
            filterData={Object.keys(metricsSchema)}
            context="overview"
          />
          <div className="flex h-min gap-3">
            {Object.values(metricsSchema).map(
              (metric: { label: string; color: string }) => (
                <OverviewMetric
                  key={metric.label}
                  label={metric.label}
                  color={metric.color}
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};
