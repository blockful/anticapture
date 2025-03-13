"use client";

import { useState } from "react";
import {
  CrossHairIcon,
  ExtractableValueToggleHeader,
  TheSectionLayout,
  TheCardChartLayout,
  SwitcherDate,
} from "@/components/atoms";
import {
  MultilineChartExtractableValue,
  AttackCostBarChart,
} from "@/components/molecules";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

export const ExtractableValueSection = () => {
  const { daoId }: { daoId: DaoIdEnum } = useParams();
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasuryMetric, setTreasuryMetric] = useState<string>(
    `Non-${daoId.toUpperCase()}`,
  );
  const [costMetric, setCostMetric] = useState<string>("Delegated");

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.attackProfitability.title}
      icon={
        <CrossHairIcon className="text-foreground" />
      }
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description={SECTIONS_CONSTANTS.attackProfitability.description}
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

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <TheCardChartLayout title="Cost of Attack by Category">
          <AttackCostBarChart />
        </TheCardChartLayout>
        <TheCardChartLayout title="Cost of Attack by Category">
          <AttackCostBarChart />
        </TheCardChartLayout>
      </div>
    </TheSectionLayout>
  );
};
