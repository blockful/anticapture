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
  totalSupply: { label: "Total Supply", color: "hsl(var(--chart-1))" },
  delegatedSupply: { label: "Delegated Supply", color: "hsl(var(--chart-2))" },
  circulatingSupply: {
    label: "Circulating Supply",
    color: "hsl(var(--chart-3))",
  },
  cexSupply: { label: "CEX Supply", color: "hsl(var(--chart-4))" },
  dexSupply: { label: "DEX Supply", color: "hsl(var(--chart-5))" },
  lendingSupply: { label: "Lending Supply", color: "hsl(var(--chart-7))" },
};

export const TokenDistributionSection = () => {
  const {
    totalSupplyChart,
    delegatedSupplyChart,
    circulatingSupplyChart,
    cexSupplyChart,
    dexSupplyChart,
    lendingSupplyChart,
    setDays,
  } = useTokenDistributionContext();

  const datasets: Record<string, DaoMetricsDayBucket[]> = {
    totalSupply: totalSupplyChart,
    delegatedSupply: delegatedSupplyChart,
    circulatingSupply: circulatingSupplyChart,
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
