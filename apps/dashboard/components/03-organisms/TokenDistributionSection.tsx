"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  TimeInterval,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/01-atoms";
import { TokenDistributionTable } from "@/components/02-molecules";

export const TokenDistributionSection = () => {
  const [timeIntervalTokenDistribution, setTimeIntervalTokenDistribution] =
    useState<TimeInterval>(TimeInterval.SEVEN_DAYS);

  return (
    <TheSectionLayout
      title="Token Distribution"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate setTimeInterval={setTimeIntervalTokenDistribution} />
      }
      description="Token distribution metrics are based on Blockful's Governance
        Indexer and are updated after a new block is confirmed with new
        interaction with relevant contracts."
    >
      <TokenDistributionTable timeInterval={timeIntervalTokenDistribution} />
    </TheSectionLayout>
  );
};
