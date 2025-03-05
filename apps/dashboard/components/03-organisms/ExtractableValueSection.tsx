"use client";

import {
  TheSectionLayout,
  SwitcherDate,
  CrossHairIcon,
} from "@/components/01-atoms";
import { extractableValueSectionAnchorID } from "@/lib/client/constants";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { TheCardChartLayout } from "../01-atoms/TheCardChartLayout";
import { useState } from "react";
import { ExtractableValueToggleHeader } from "../01-atoms/ExtractableValueToggleHeader";
import { MultilineChartExtractableValue } from "../02-molecules/MultilineChartExtractableValue";

export const ExtractableValueSection = () => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasuryMetric, setTreasuryMetric] = useState<string>("All");
  const [costMetric, setCostMetric] = useState<string>("Quorum");

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
    </TheSectionLayout>
  );
};
