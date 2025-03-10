"use client";

import { TheSectionLayout, TheCardChartLayout } from "@/components/atoms";
import { attackCostSectionAnchorID } from "@/lib/client/constants";
import { ShieldIcon } from "lucide-react";
import AttackCostBarChart from "../molecules/AttackCostBarChart";

export const AttackCostSection = () => {
  return (
    <TheSectionLayout
      title="Attack Cost Analysis"
      icon={<ShieldIcon className="text-foreground" />}
      description="This section shows the cost of attack across different metrics. The data represents the minimum amount required to successfully execute an attack on the protocol."
      anchorId={attackCostSectionAnchorID}
    >
      <div className="grid grid-cols-2 flex-col gap-4">
        <div className="flex flex-col gap-4">
          <TheCardChartLayout
            headerComponent={<div>Cost of Attack by Category</div>}
            title="Cost of Attack by Category"
          >
            <AttackCostBarChart />
          </TheCardChartLayout>
        </div>
        <TheCardChartLayout title="Cost of Attack by Category">
          <AttackCostBarChart />
        </TheCardChartLayout>
      </div>
    </TheSectionLayout>
  );
};
