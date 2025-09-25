"use client";

import { useState } from "react";
import { TheSectionLayout, RiskLevelCard } from "@/shared/components";
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
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { InlineAlert } from "@/shared/components/alerts/InlineAlert";
import { getDateRange } from "@/shared/utils";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";

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
      title={PAGES_CONSTANTS.attackProfitability.title}
      icon={<Crosshair2Icon className="section-layout-icon" />}
      description={PAGES_CONSTANTS.attackProfitability.description}
      // switchDate={
      //   <SwitcherDate
      //     defaultValue={defaultDays}
      //     setTimeInterval={setDays}
      //     disableRecentData={true}
      //   />
      // }
      // days={days}
      riskLevel={<RiskLevelCard status={attackProfitability?.riskLevel} />}
    >
      <SubSectionsContainer>
        <SubSection
          subsectionTitle={"Cost of Attack vs Profit"}
          dateRange={getDateRange(days ?? "")}
          switchDate={
            <SwitcherDateMobile
              defaultValue={defaultDays}
              setTimeInterval={setDays}
              disableRecentData={true}
            />
          }
        >
          <InlineAlert
            variant="info"
            label="Treasury values above supply costs indicate high risk."
          />
          <MultilineChartAttackProfitability
            days={days}
            filterData={[treasuryMetric, costMetric]}
          />

          <AttackProfitabilityToggleHeader
            treasuryMetric={treasuryMetric}
            setTreasuryMetric={setTreasuryMetric}
            costMetric={costMetric}
            setCostMetric={setCostMetric}
          />
        </SubSection>
        <DividerDefault isHorizontal />
        <SubSection
          subsectionTitle={"Cost Comparison"}
          subsectionDescription={"All values reflect current data."}
          dateRange=""
        >
          <div className="flex flex-row gap-5">
            <AttackCostBarChart />
            <div className="flex flex-col gap-2">
              <AttackProfitabilityAccordion />
            </div>
          </div>
        </SubSection>
      </SubSectionsContainer>

      {/* <TheCardChartLayout
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
        >
          <AttackCostBarChart />
        </TheCardChartLayout>
        <div className="flex flex-col gap-2">
          <AttackProfitabilityAccordion />
        </div>
      </div> */}
    </TheSectionLayout>
  );
};
