"use client";

import { TheSectionLayout } from "@/components/01-atoms";
import { DashboardTable } from "@/components/02-molecules";
import { dashboardSectionAnchorID } from "@/lib/client/constants";

export const HomeDashboardSection = () => {
  return (
    <TheSectionLayout title="Dashboard" anchorId={dashboardSectionAnchorID}>
      <DashboardTable />
    </TheSectionLayout>
  );
};
