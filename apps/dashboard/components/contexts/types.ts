import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/server/backend";

export interface MetricData {
  value: string | undefined;
  changeRate: string | undefined;
}

export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  setTotalSupply: (totalSupply: MetricData) => void;
  totalSupplyChart: DaoMetricsDayBucket[];
  setTotalSupplyChart: (totalSupplyChart: DaoMetricsDayBucket[]) => void;
  circulatingSupply: MetricData;
  setCirculatingSupply: (circulatingSupply: MetricData) => void;
  circulatingSupplyChart: DaoMetricsDayBucket[];
  setCirculatingSupplyChart: (
    circulatingSupplyChart: DaoMetricsDayBucket[],
  ) => void;
  delegatedSupply: MetricData;
  setDelegatedSupply: (delegatedSupply: MetricData) => void;
  delegatedSupplyChart: DaoMetricsDayBucket[];
  setDelegatedSupplyChart: (
    delegatedSupplyChart: DaoMetricsDayBucket[],
  ) => void;
  cexSupply: MetricData;
  setCexSupply: (cexSupply: MetricData) => void;
  cexSupplyChart: DaoMetricsDayBucket[];
  setCexSupplyChart: (cexSupplyChart: DaoMetricsDayBucket[]) => void;
  dexSupply: MetricData;
  setDexSupply: (dexSupply: MetricData) => void;
  dexSupplyChart: DaoMetricsDayBucket[];
  setDexSupplyChart: (dexSupplyChart: DaoMetricsDayBucket[]) => void;
  lendingSupply: MetricData;
  setLendingSupply: (lendingSupply: MetricData) => void;
  lendingSupplyChart: DaoMetricsDayBucket[];
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
  setProposals: (proposals: MetricData) => void;
  proposalsSupplyChart: DaoMetricsDayBucket[];
  setProposalsSupplyChart: (
    proposalsSupplyChart: DaoMetricsDayBucket[],
  ) => void;

  activeSupply: MetricData;
  setActiveSupply: (activeSupply: MetricData) => void;
  activeSupplyChart: DaoMetricsDayBucket[];
  setActiveSupplyChart: (activeSupplyChart: DaoMetricsDayBucket[]) => void;

  votes: MetricData;
  setVotes: (votes: MetricData) => void;
  votesSupplyChart: DaoMetricsDayBucket[];
  setVotesSupplyChart: (votesSupplyChart: DaoMetricsDayBucket[]) => void;

  averageTurnout: MetricData;
  setAverageTurnout: (averageTurnout: MetricData) => void;
  averageTurnoutSupplyChart: DaoMetricsDayBucket[];
  setAverageTurnoutSupplyChart: (
    averageTurnoutSupplyChart: DaoMetricsDayBucket[],
  ) => void;
}
