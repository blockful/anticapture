import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";

import { KpiRow } from "@/features/revenue/components/KpiRow";
import { MonthlyRevenueChart } from "@/features/revenue/components/MonthlyRevenueChart";
import { NameGrowthChart } from "@/features/revenue/components/NameGrowthChart";
import { NewUsersChart } from "@/features/revenue/components/NewUsersChart";
import { RenewalRateCohort } from "@/features/revenue/components/RenewalRateCohort";
import { RevenueOverviewCard } from "@/features/revenue/components/RevenueOverviewCard";
import { RevenueSummaryCard } from "@/features/revenue/components/RevenueSummaryCard";
import { UpcomingExpirationsChart } from "@/features/revenue/components/UpcomingExpirationsChart";

export const RevenueSection = () => {
  return (
    <TheSectionLayout
      title="Revenue"
      description="Protocol financial health: revenue, registrations, and name retention."
      hideDivider
    >
      <div className="flex flex-col gap-4 pb-8">
        {/* Section 1 — Revenue Summary */}
        <RevenueSummaryCard />

        {/* Section 2 — All Time Revenue by Stream */}
        <MonthlyRevenueChart />

        {/* Section 3 — Stream Breakdown */}
        <RevenueOverviewCard />

        {/* Section 4 — Usage & Adoption + KPI Row */}
        <KpiRow />

        {/* Section 5 — Name Growth & Churn */}
        <NameGrowthChart />

        {/* Section 6 — New Users Entering ENS */}
        <NewUsersChart />

        {/* Section 7 — Bottom Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpcomingExpirationsChart />
          <RenewalRateCohort />
        </div>
      </div>
    </TheSectionLayout>
  );
};
