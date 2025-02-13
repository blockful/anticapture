"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/01-atoms";
import { TokenDistributionTable } from "@/components/02-molecules";
import { tokenDistributionSectionAnchorID } from "@/lib/client/constants";
import { useTokenDistributionContext } from "../contexts/TokenDistributionContext";
import { TimeInterval } from "@/lib/enums/TimeInterval";

export const TokenDistributionSection = () => {
  const {days, setDays} = useTokenDistributionContext();

  return (
    <TheSectionLayout
      title="Token Distribution"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate defaultValue={TimeInterval.NINETY_DAYS} setTimeInterval={setDays} />
      }
      description="Token distribution metrics are based on Blockful's Governance
        Indexer and are updated after a new block is confirmed with new
        interaction with relevant contracts."
      anchorId={tokenDistributionSectionAnchorID}
    >
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
