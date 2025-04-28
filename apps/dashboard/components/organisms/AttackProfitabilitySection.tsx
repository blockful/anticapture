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
  MultilineChartAttackProfitability,
  AttackCostBarChart,
} from "@/components/molecules";
import { TimeInterval } from "@/lib/enums";
import { DaoIdEnum } from "@/lib/types/daos";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { AttackProfitabilityConfig } from "@/lib/dao-config/types";

export const AttackProfitabilitySection = ({
  daoId,
  attackProfitability,
}: {
  daoId: DaoIdEnum;
  attackProfitability: AttackProfitabilityConfig;
}) => {
  const defaultDays = TimeInterval.ONE_YEAR;
  const [days, setDays] = useState<TimeInterval>(defaultDays);
  const [treasuryMetric, setTreasuryMetric] = useState<string>(`Non-${daoId}`);
  const [costMetric, setCostMetric] = useState<string>("Delegated");
  if (!attackProfitability) {
    return null;
  }

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.attackProfitability.title}
      subtitle={"Cost of Attack vs Profit"}
      icon={<CrossHairIcon className="text-foreground" />}
      description={SECTIONS_CONSTANTS.attackProfitability.description}
      infoText={
        "Treasury values above supply costs indicate high risk. And probably we can add something else here."
      }
      switchDate={
        <SwitcherDate
          defaultValue={defaultDays}
          setTimeInterval={setDays}
          disableRecentData={true}
        />
      }
      days={days}
      anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
      riskLevel={<RiskLevelCard status={attackProfitability?.riskLevel} />}
    >
      <TheCardChartLayout
        headerComponent={
          <ExtractableValueToggleHeader
            treasuryMetric={treasuryMetric}
            setTreasuryMetric={setTreasuryMetric}
            costMetric={costMetric}
            setCostMetric={setCostMetric}
          />
        }
      >
        <MultilineChartAttackProfitability
          days={days}
          filterData={[treasuryMetric, costMetric]}
        />
      </TheCardChartLayout>
      <div className="w-full border-t border-lightDark" />
      <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        <TheCardChartLayout
          title="Cost Comparison"
          subtitle="Treasury values above supply costs indicate high risk."
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
