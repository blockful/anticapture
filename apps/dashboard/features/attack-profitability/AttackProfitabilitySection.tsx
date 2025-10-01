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
  if (!attackProfitability) {
    return null;
  }

  const handleDropdownClick = (option: Option) => {
    setDropdownValue(option);
  };

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
          <div className="flex w-full pt-3">
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
          switcherComponent={
            <Dropdown
              value={dropdownValue}
              options={[
                { value: "usd", label: "USD" },
                { value: "token", label: "Token Amount" },
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
