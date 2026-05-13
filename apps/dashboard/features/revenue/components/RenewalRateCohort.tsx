import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";

import { RENEWAL_RATE_COHORTS } from "@/features/revenue/data/mock";

const cohortColor = (rate: number) => (rate >= 65 ? "#15803d" : "#ca8a04");

export const RenewalRateCohort = () => {
  return (
    <Card className="flex flex-col p-4">
      <p className="text-secondary text-sm font-medium">
        Renewal Rate by Registration Year
      </p>
      <p className="text-secondary mt-0.5 text-sm">
        Declining — newer cohorts renew at lower rates (90-day grace window)
      </p>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-4 lg:gap-0">
        {RENEWAL_RATE_COHORTS.map((cohort) => (
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
