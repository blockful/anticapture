"use client";

import { useState } from "react";
import {
  CrossHairIcon,
  ExtractableValueToggleHeader,
  TheSectionLayout,
  TheCardChartLayout,
  SwitcherDate,
  ExtractableValueAccordion,
} from "@/components/atoms";
import {
  MultilineChartExtractableValue,
  AttackCostBarChart,
} from "@/components/molecules";
import { extractableValueSectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";

export const ExtractableValueSection = () => {
  const { daoId }: { daoId: DaoIdEnum } = useParams();
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasuryMetric, setTreasuryMetric] = useState<string>(
    `Non-${daoId.toUpperCase()}`,
  );
  const [costMetric, setCostMetric] = useState<string>("Delegated");

  return (
    <TheSectionLayout
      title="Extractable Value"
      icon={<CrossHairIcon className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
      anchorId={extractableValueSectionAnchorID}
    >
      <TheCardChartLayout
        title="Cost of Attack vs Profit"
        headerComponent={
          <ExtractableValueToggleHeader
            treasuryMetric={treasuryMetric}
            setTreasuryMetric={setTreasuryMetric}
            costMetric={costMetric}
            setCostMetric={setCostMetric}
          />
        }
      >
        <MultilineChartExtractableValue
          days={days}
          filterData={[treasuryMetric, costMetric]}
        />
      </TheCardChartLayout>

      <div className="grid w-full gap-4 md:grid-cols-1 lg:grid-cols-2">
        <TheCardChartLayout title="Cost of Attack by Category">
          <AttackCostBarChart />
        </TheCardChartLayout>
        <div className="flex flex-col gap-2">
          <ExtractableValueAccordion />
        </div>
      </div>
    </TheSectionLayout>
  );
};
