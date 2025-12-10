export enum DaoIdEnum {
  COMP = "COMP",
  ENS = "ENS",
  NOUNS = "NOUNS",
  SCR = "SCR",
  OBOL = "OBOL",
  OPTIMISM = "OP",
  UNISWAP = "UNI",
  GITCOIN = "GTC",
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
