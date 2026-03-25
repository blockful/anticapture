export enum DaoIdEnum {
  AAVE = "AAVE",
  COMP = "COMP",
  ENS = "ENS",
  FLUID = "FLUID",
  LIL_NOUNS = "LIL_NOUNS",
  NOUNS = "NOUNS",
  SCR = "SCR",
  OBOL = "OBOL",
  SHU = "SHU",
  // OPTIMISM = "OP",
  UNISWAP = "UNI",
  GITCOIN = "GTC",
  TORN = "TORN",
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
