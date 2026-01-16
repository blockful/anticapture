import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { TokenMetricItem } from "@/shared/dao-config/types";

export interface MetricData {
  value: string | undefined | null;
  changeRate: string | undefined | null;
}

export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  totalSupplyChart: TokenMetricItem[];
  circulatingSupply: MetricData;
  circulatingSupplyChart: TokenMetricItem[];
  delegatedSupply: MetricData;
  delegatedSupplyChart: TokenMetricItem[];
  cexSupply: MetricData;
  cexSupplyChart: TokenMetricItem[];
  dexSupply: MetricData;
  dexSupplyChart: TokenMetricItem[];
  lendingSupply: MetricData;
  lendingSupplyChart: TokenMetricItem[];
}

export interface GovernanceActivityContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  treasury: MetricData;
  setTreasury: (treasury: MetricData) => void;
  treasurySupplyChart: TokenMetricItem[];
  setTreasurySupplyChart: (treasurySupplyChart: TokenMetricItem[]) => void;
  proposals: MetricData;
  activeSupply: MetricData;
  votes: MetricData;
  averageTurnout: MetricData;
}
