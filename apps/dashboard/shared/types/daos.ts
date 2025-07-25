export enum DaoIdEnum {
  UNISWAP = "UNI",
  ENS = "ENS",
  OPTIMISM = "OP",
  ARBITRUM = "ARB",
}

export interface DAO {
  id: DaoIdEnum;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply?: number;
}

export const ALL_DAOS = Object.values(DaoIdEnum);
