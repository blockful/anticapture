"use client";

import { useState } from "react";
import {
  CrossHairIcon,
  ExtractableValueToggleHeader,
  TheSectionLayout,
  TheCardChartLayout,
  SwitcherDate,
  RiskLevelCard,
  ExtractableValueAccordion,
} from "@/components/atoms";
import {
  MultilineChartExtractableValue,
  AttackCostBarChart,
} from "@/components/molecules";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { SECTIONS_CONSTANTS } from "@/lib/constants";

export const AttackProfitabilitySection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasuryMetric, setTreasuryMetric] = useState<string>(`Non-${daoId}`);
  const [costMetric, setCostMetric] = useState<string>("Delegated");

  const daoConstants = daoConstantsByDaoId[daoId.toUpperCase() as DaoIdEnum];

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.attackProfitability.title}
      icon={<CrossHairIcon className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description={SECTIONS_CONSTANTS.attackProfitability.description}
      anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
    >
      <RiskLevelCard status={daoConstants.attackProfitability.riskLevel} />
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
