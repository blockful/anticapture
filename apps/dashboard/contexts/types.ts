import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";

export interface MetricData {
  value: string | undefined | null;
  changeRate: string | undefined | null;
}

export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  setTotalSupply: (totalSupply: MetricData) => void;
  totalSupplyChart: DaoMetricsDayBucket[] | undefined;
  setTotalSupplyChart: (totalSupplyChart: DaoMetricsDayBucket[]) => void;
  circulatingSupply: MetricData;
  setCirculatingSupply: (circulatingSupply: MetricData) => void;
  circulatingSupplyChart: DaoMetricsDayBucket[] | undefined;
  setCirculatingSupplyChart: (
    circulatingSupplyChart: DaoMetricsDayBucket[],
  ) => void;
  delegatedSupply: MetricData;
  setDelegatedSupply: (delegatedSupply: MetricData) => void;
  delegatedSupplyChart: DaoMetricsDayBucket[] | undefined;
  setDelegatedSupplyChart: (
    delegatedSupplyChart: DaoMetricsDayBucket[],
  ) => void;
  cexSupply: MetricData;
  setCexSupply: (cexSupply: MetricData) => void;
  cexSupplyChart: DaoMetricsDayBucket[] | undefined;
  setCexSupplyChart: (cexSupplyChart: DaoMetricsDayBucket[]) => void;
  dexSupply: MetricData;
  setDexSupply: (dexSupply: MetricData) => void;
  dexSupplyChart: DaoMetricsDayBucket[] | undefined;
  setDexSupplyChart: (dexSupplyChart: DaoMetricsDayBucket[]) => void;
  lendingSupply: MetricData;
  setLendingSupply: (lendingSupply: MetricData) => void;
  lendingSupplyChart: DaoMetricsDayBucket[] | undefined;
  setLendingSupplyChart: (lendingSupplyChart: DaoMetricsDayBucket[]) => void;
}

export interface GovernanceActivityContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  treasury: MetricData;

  setTreasury: (treasury: MetricData) => void;
  treasurySupplyChart: DaoMetricsDayBucket[];
  setTreasurySupplyChart: (treasurySupplyChart: DaoMetricsDayBucket[]) => void;

  proposals: MetricData;

  activeSupply: MetricData;

  votes: MetricData;

  averageTurnout: MetricData;
}
