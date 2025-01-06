"use client";

import { TheSectionLayout } from "@/components/01-atoms";
import { DashboardTable } from "../02-molecules/DashboardTable";

export const DashboardSection = () => {
  return (
    <TheSectionLayout title="Dashboard">
      <DashboardTable />
    </TheSectionLayout>
  );
};
