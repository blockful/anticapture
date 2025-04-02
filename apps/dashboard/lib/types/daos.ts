import daoConstantsByDaoId from "@/lib/dao-constants";

export enum DaoIdEnum {
  UNISWAP = "UNI",
  ENS = "ENS",
  OPTIMISM = "OP",
  ARBITRUM = "ARB",
}

export const SUPPORTED_DAO_NAMES = Object.values(DaoIdEnum).filter(
  (daoId) => !daoConstantsByDaoId[daoId].inAnalysis,
);

export interface DAO {
  id: DaoIdEnum;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply?: number;
}
