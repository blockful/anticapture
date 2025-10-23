"use client";

import { useState } from "react";
import {
  TheSectionLayout,
  RiskLevelCard,
  TheCardChartLayout,
  SwitcherDate,
} from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { AttackProfitabilityConfig } from "@/shared/dao-config/types";
import {
  AttackProfitabilityAccordion,
  MultilineChartAttackProfitability,
  AttackCostBarChart,
  AttackProfitabilityToggleHeader,
} from "@/features/attack-profitability/components";
import { Crosshair2Icon } from "@radix-ui/react-icons";
import { Data } from "react-csv/lib/core";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { useLastUpdateLabel } from "@/features/attack-profitability/hooks/useLastUpdateLabel";
import { ChartType } from "@/shared/hooks/useLastUpdate";
import { getDateRange } from "@/shared/utils";
import { Dropdown, Option } from "@/shared/components/dropdowns/Dropdown";

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
  const [dropdownValue, setDropdownValue] = useState<Option>({
    value: "usd",
    label: "USD",
  });

  const [costProfitabilityCsvData, setCostProfitabilityCsvData] =
    useState<Data>([]);
  const [attackProfitabilityCsvData, setAttackProfitabilityCsvData] =
    useState<Data>([]);
  const attackUpdate = useLastUpdateLabel(daoId, ChartType.AttackProfitability);
  const costUpdate = useLastUpdateLabel(daoId, ChartType.AttackProfitability);

  if (!attackProfitability) {
    return null;
  }

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.attackProfitability.title}
      icon={<Crosshair2Icon className="section-layout-icon" />}
      description={PAGES_CONSTANTS.attackProfitability.description}
      riskLevel={<RiskLevelCard status={attackProfitability?.riskLevel} />}
    >
      <TheCardChartLayout
        title="Cost of Attack vs Profit"
        subtitle={getDateRange(days ?? "")}
        headerComponent={
          <div className="flex w-full flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center">
            <BadgeStatus
              variant="outline"
              iconVariant={attackUpdate.hasData ? "success" : "warning"}
              isLoading={attackUpdate.isLoading}
              icon={attackUpdate.icon}
              className="w-fit"
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
        switcherComponent={
          <SwitcherDate
            defaultValue={defaultDays}
            setTimeInterval={setDays}
            disableRecentData={true}
          />
        }
        infoText={"Treasury values above supply costs indicate high risk."}
        csvData={attackProfitabilityCsvData}
      >
        <MultilineChartAttackProfitability
          days={days}
          filterData={[treasuryMetric, costMetric]}
          setCsvData={setAttackProfitabilityCsvData}
        />
      </TheCardChartLayout>
      <div className="border-light-dark w-full border-t" />
      <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        <TheCardChartLayout
          title="Cost Comparison"
          subtitle="All values reflect current data."
          csvData={costProfitabilityCsvData}
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
          switcherComponent={
            <Dropdown
              value={dropdownValue}
              options={[
                { value: "usd", label: "USD" },
                { value: "token", label: "Token" },
              ]}
              onClick={setDropdownValue}
            />
          }
        >
          <AttackCostBarChart
            setCsvData={setCostProfitabilityCsvData}
            valueMode={dropdownValue.value as "usd" | "token"}
          />
        </TheCardChartLayout>
        <div className="flex flex-col gap-2">
          <AttackProfitabilityAccordion />
        </div>
      </div>
    </TheSectionLayout>
  );
};
