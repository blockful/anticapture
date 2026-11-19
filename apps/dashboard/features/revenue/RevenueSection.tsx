import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { ReportPanelButton } from "@/shared/components/report/ReportPanelButton";

import { DataFreshness } from "@/features/revenue/components/DataFreshness";
import { Ensv2Section } from "@/features/revenue/components/Ensv2Section";
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
      headerAction={<ReportPanelButton panel="Revenue" />}
    >
      <div className="flex flex-col gap-4 pb-8">
        {/* Data cutoff and delay warning for every card below */}
        <DataFreshness />

        {/* Section 1 — Revenue Summary */}
        <RevenueSummaryCard />

        {/* Section 2 — All Time Revenue by Stream */}
        <MonthlyRevenueChart />

        {/* Section 3 — Stream Breakdown */}
        <RevenueOverviewCard />

        {/* Section 4 — ENSv2: revenue and migration since the launch */}
        <Ensv2Section />

        {/* Section 5 — Usage & Adoption + KPI Row */}
        <KpiRow />

        {/* Section 6 — Name Growth & Churn */}
        <NameGrowthChart />

        {/* Section 7 — New Users Entering ENS */}
        <NewUsersChart />

        {/* Section 8 — Bottom Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpcomingExpirationsChart />
          <RenewalRateCohort />
        </div>
      </div>
    </TheSectionLayout>
  );
};
