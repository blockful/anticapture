"use client";

import { useMemo } from "react";
import { useGetRevenueRenewalFunnel } from "@anticapture/client/hooks";

import { DeepLinkTitle } from "@/shared/components/deep-link";
import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { deepLinkTarget } from "@/shared/utils/deepLink";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";
import { formatUtcDate } from "@/features/revenue/utils/format";
import { toRenewalCohortCutoff } from "@/features/revenue/utils/meta";
import { transformToRenewalCohorts } from "@/features/revenue/utils/transform";

/** The Renewals colour of the revenue charts. One colour: the bar length carries the value. */
const COHORT_COLOR = "#15803d";

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
    <Card
      {...deepLinkTarget(REVENUE_ANCHORS.renewalRateByYear)}
      className="flex flex-col p-4"
    >
      <DeepLinkTitle
        slug={REVENUE_ANCHORS.renewalRateByYear}
        info={
          <InfoTooltip>
            {paragraphs(
              "Share of .eth registration terms expiring in each year that were renewed before the end of their grace period (90 days after expiry; 28 days for names registered on ENSv2).",
              `Formula: ${code("renewed terms ÷ expiring terms × 100")}, per expiry year.`,
              "Each registration or renewal is one term, so a name renewed several times counts several times. A renewal that leaves the name still expired (a grace-period top-up) is not a term. Names registered before ENSv2 are grouped by their v1 expiry (their ENSv2 expiry minus 62 days).",
              `Only terms whose grace period has ended are included${meta.asOf ? ` (expiring before ${formatUtcDate(toRenewalCohortCutoff(meta.asOf))}, 90 days before the data cutoff)` : ""}, so the latest year is partial.`,
            )}
          </InfoTooltip>
        }
      >
        Renewal Rate by Expiry Year
      </DeepLinkTitle>
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
                  style={{ color: COHORT_COLOR }}
                >
                  {cohort.rate}%
                </span>
              </div>
              <ProgressBar value={cohort.rate} color={COHORT_COLOR} rounded />
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
