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
import { TimeInterval } from "@/lib/enums";
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
      riskLevel={
        <RiskLevelCard status={daoConstants.attackProfitability.riskLevel} />
      }
    >
      <TheCardChartLayout
        title="Cost of Attack vs Profit"
        description="Attack cost is 50% lower than the treasury, meaning high risk"
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
        <TheCardChartLayout
          title={
            <div className="flex flex-col">
              <span className="text-sm font-medium">Cost Comparison</span>
              <span className="text-sm font-normal text-foreground">
                Dollar value comparison of key security indicators.
              </span>
            </div>
          }
        >
          <AttackCostBarChart />
        </TheCardChartLayout>
        <div className="flex flex-col gap-2">
          <ExtractableValueAccordion />
        </div>
      </div>
    </TheSectionLayout>
  );
};
