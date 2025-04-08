import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";

export interface MetricData {
  value: string | undefined;
  changeRate: string | undefined;
}

export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  totalSupplyChart: DaoMetricsDayBucket[];
  circulatingSupply: MetricData;
  circulatingSupplyChart: DaoMetricsDayBucket[];
  delegatedSupply: MetricData;
  delegatedSupplyChart: DaoMetricsDayBucket[];
  cexSupply: MetricData;
  cexSupplyChart: DaoMetricsDayBucket[];
  dexSupply: MetricData;
  dexSupplyChart: DaoMetricsDayBucket[];
  lendingSupply: MetricData;
  lendingSupplyChart: DaoMetricsDayBucket[];
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
