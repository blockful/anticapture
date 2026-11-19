"use client";

import { useMemo } from "react";
import { useGetRevenueRenewalFunnel } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { formatUtcDate } from "@/features/revenue/utils/format";
import { toRenewalCohortCutoff } from "@/features/revenue/utils/meta";
import { transformToRenewalCohorts } from "@/features/revenue/utils/transform";

const cohortColor = (rate: number) => (rate >= 65 ? "#15803d" : "#ca8a04");

export const RenewalRateCohort = () => {
  const funnelQuery = useGetRevenueRenewalFunnel("ens");
  const funnel = useRevenueDataState(funnelQuery);
  const { isLoading, isUnavailable, items, meta } = funnel;
  const cohorts = useMemo(
    () =>
      isLoading || isUnavailable ? null : transformToRenewalCohorts(items),
    [isLoading, isUnavailable, items],
  );

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-secondary text-sm font-medium">
          Renewal Rate by Expiry Year
        </p>
        <InfoTooltip>
          Share of .eth registration terms expiring in each year that were
          renewed before the end of their grace period (expiry + 90 days). Each
          registration or renewal is one term, so a name renewed several times
          counts several times. Only terms whose grace period has ended are
          included
          {meta.asOf
            ? ` (expiring before ${formatUtcDate(toRenewalCohortCutoff(meta.asOf))}, 90 days before the data cutoff)`
            : ""}
          , so the latest year is partial.
        </InfoTooltip>
      </div>
      <p className="text-secondary mt-0.5 text-sm">
        Percentage of expiring terms renewed, by expiry year
      </p>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-4 lg:gap-0">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="bg-surface-raised h-4 w-10 animate-pulse rounded" />
                <div className="bg-surface-raised h-4 w-8 animate-pulse rounded" />
              </div>
              <div className="bg-surface-raised h-2 w-full animate-pulse rounded" />
            </div>
          ))
        ) : isUnavailable ? (
          <UnavailableChart height={200} />
        ) : (
          cohorts?.map((cohort) => (
            <div key={cohort.year} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-secondary text-sm font-medium">
                  {cohort.year}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: cohortColor(cohort.rate) }}
                >
                  {cohort.rate}%
                </span>
              </div>
              <ProgressBar
                value={cohort.rate}
                color={cohortColor(cohort.rate)}
                rounded
              />
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
