import {
  ArrowLeftRight,
  TheSectionLayout,
  SwitcherDate,
} from "@/components/atoms";
import {
  MultilineChartTokenDistribution,
  TokenDistributionTable,
} from "@/components/molecules";
import { tokenDistributionSectionAnchorID } from "@/lib/client/constants";
import { useTokenDistributionContext } from "@/contexts";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";

const chartConfig: Record<string, { label: string; color: string }> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#1E88E5",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FF9800",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#43A047",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#9C27B0",
  },
};

export const TokenDistributionSection = () => {
  const {
    delegatedSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
    setDays,
  } = useTokenDistributionContext();

  const datasets: Record<string, DaoMetricsDayBucket[]> = {
    delegatedSupply: delegatedSupplyChart,
    cexSupply: cexSupplyChart,
    dexSupply: dexSupplyChart,
    lendingSupply: lendingSupplyChart,
  };

  return (
    <TheSectionLayout
      title="Token Distribution"
      icon={<ArrowLeftRight className="text-foreground" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.NINETY_DAYS}
          setTimeInterval={setDays}
        />
      }
      description="Token distribution metrics are based on Blockful's Governance
        Indexer and are updated after a new block is confirmed with new
        interaction with relevant contracts."
      anchorId={tokenDistributionSectionAnchorID}
    >
      <MultilineChartTokenDistribution
        datasets={datasets}
        chartConfig={chartConfig}
      />
      <TokenDistributionTable />
    </TheSectionLayout>
  );
};
