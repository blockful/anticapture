"use client";

import { TheSectionLayout } from "@/components/01-atoms";
import { DashboardTable } from "@/components/02-molecules";

export const HomeDashboardSection = () => {
  return (
    <TheSectionLayout title="Dashboard">
      <DashboardTable />
    </TheSectionLayout>
  );
};
