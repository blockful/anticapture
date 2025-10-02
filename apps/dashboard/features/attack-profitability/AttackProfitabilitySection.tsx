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
import { Data } from "react-csv/lib/core";
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

  if (!attackProfitability) {
    return null;
  }

  const handleDropdownClick = (option: Option) => {
    setDropdownValue(option);
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.attackProfitability.title}
      icon={<Crosshair2Icon className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.attackProfitability.description}
      anchorId={SECTIONS_CONSTANTS.attackProfitability.anchorId}
      riskLevel={<RiskLevelCard status={attackProfitability?.riskLevel} />}
    >
      <TheCardChartLayout
        title="Cost of Attack vs Profit"
        subtitle={getDateRange(days ?? "")}
        headerComponent={
          <div className="flex w-full pt-3">
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
        >
          <AttackCostBarChart setCsvData={setCostProfitabilityCsvData} />
          switcherComponent={
            <Dropdown
              value={dropdownValue}
              options={[
                { value: "usd", label: "USD" },
                { value: "token", label: "Token" },
              ]}
              onClick={handleDropdownClick}
            />
          }
        >
          <AttackCostBarChart
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
