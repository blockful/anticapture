"use client";

import {
  ArrowLeftRight,
  SwitcherDate,
  TimeInterval,
  UniswapIcon,
} from "@/components/01-atoms";
import {
  TokenDistributionTable,
  UniswapDaoInfo,
} from "@/components/02-molecules";
import { TheSection } from "@/components/03-organisms";
import { useState } from "react";
import { GovernanceActivityTable } from "../02-molecules/GovernanceActivityTable";

export const HomeTemplate = () => {
  const [timeIntervalTokenDistribution, setTimeIntervalTokenDistribution] =
    useState<TimeInterval>(TimeInterval.SEVEN_DAYS);
  const [timeIntervalGovernanceActivity, setTimeIntervalGovernanceActivity] =
    useState<TimeInterval>(TimeInterval.SEVEN_DAYS);

  return (
    <main className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <TheSection
        title="Uniswap DAO Info"
        icon={<UniswapIcon className="text-foreground" />}
      >
        <UniswapDaoInfo />
      </TheSection>
      <TheSection
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
      </TheSection>
      <TheSection
        title="Governance activity"
        icon={<ArrowLeftRight className="text-foreground" />}
        switchDate={
          <SwitcherDate setTimeInterval={setTimeIntervalGovernanceActivity} />
        }
        description="Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current"
      >
        <GovernanceActivityTable
          timeInterval={timeIntervalGovernanceActivity}
        />
      </TheSection>
    </main>
  );
};
