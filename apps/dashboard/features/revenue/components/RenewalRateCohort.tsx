"use client";

import { useGetRevenueRenewalFunnel } from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";

import { transformToRenewalCohorts } from "@/features/revenue/utils/transform";

const cohortColor = (rate: number) => (rate >= 65 ? "#15803d" : "#ca8a04");

export const RenewalRateCohort = () => {
  const { data, isLoading } = useGetRevenueRenewalFunnel("ens");
  const cohorts = data ? transformToRenewalCohorts(data.items) : null;

  return (
    <Card className="flex flex-col p-4">
      <p className="text-secondary text-sm font-medium">
        Renewal Rate by Expiry Year
      </p>
      <p className="text-secondary mt-0.5 text-sm">
        Average renewal rate for names expiring each year
      </p>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-4 lg:gap-0">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="bg-surface-raised h-4 w-10 animate-pulse rounded" />
                  <div className="bg-surface-raised h-4 w-8 animate-pulse rounded" />
                </div>
                <div className="bg-surface-raised h-2 w-full animate-pulse rounded" />
              </div>
            ))
          : cohorts?.map((cohort) => (
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
            ))}
      </div>
    </Card>
  );
};
