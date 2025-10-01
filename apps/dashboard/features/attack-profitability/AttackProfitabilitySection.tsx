"use client";

import { useState } from "react";
import {
  TheSectionLayout,
  TheCardChartLayout,
  SwitcherDate,
  RiskLevelCard,
} from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { AttackProfitabilityConfig } from "@/shared/dao-config/types";
import {
  AttackProfitabilityAccordion,
  MultilineChartAttackProfitability,
  AttackCostBarChart,
  AttackProfitabilityToggleHeader,
} from "@/features/attack-profitability/components";
import { Crosshair2Icon } from "@radix-ui/react-icons";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { useLastUpdateLabel } from "@/features/attack-profitability/hooks/useLastUpdateLabel";
import { ChartType } from "@/shared/hooks/useLastUpdate";

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
  const attackUpdate = useLastUpdateLabel(daoId, ChartType.AttackProfitability);
  const costUpdate = useLastUpdateLabel(daoId, ChartType.AttackProfitability);

  if (!attackProfitability) {
    return null;
  }

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.attackProfitability.title}
      subtitle={"Cost of Attack vs Profit"}
      icon={<Crosshair2Icon className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.attackProfitability.description}
      infoText={"Treasury values above supply costs indicate high risk."}
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
          <div className="flex w-full items-center gap-3 pt-3">
            <BadgeStatus
              variant="outline"
              iconVariant={attackUpdate.hasData ? "success" : "warning"}
              isLoading={attackUpdate.isLoading}
              icon={attackUpdate.icon}
            >
              Last updated: {attackUpdate.label}
            </BadgeStatus>
            <div className="border-border-default border-1 hidden h-5 sm:block" />

            <AttackProfitabilityToggleHeader
              treasuryMetric={treasuryMetric}
              setTreasuryMetric={setTreasuryMetric}
              costMetric={costMetric}
              setCostMetric={setCostMetric}
            />
          </div>
        }
      >
        <MultilineChartAttackProfitability
          days={days}
          filterData={[treasuryMetric, costMetric]}
        />
      </TheCardChartLayout>
      <div className="border-light-dark w-full border-t" />
      <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        <TheCardChartLayout
          title="Cost Comparison"
          subtitle="All values reflect current data."
          headerComponent={
            <BadgeStatus
              variant="outline"
              iconVariant={costUpdate.hasData ? "success" : "warning"}
              isLoading={costUpdate.isLoading}
              icon={costUpdate.icon}
              className="w-fit"
            >
              Last updated: {costUpdate.label}
            </BadgeStatus>
          }
        >
          <AttackCostBarChart />
        </TheCardChartLayout>
        <div className="flex flex-col gap-2">
          <AttackProfitabilityAccordion />
        </div>
      </div>
    </TheSectionLayout>
  );
};
