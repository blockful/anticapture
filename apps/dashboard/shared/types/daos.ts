export enum DaoIdEnum {
  UNISWAP = "UNI",
  ENS = "ENS",
  OPTIMISM = "OP",
  GITCOIN = "GTC",
  NOUNS = "NOUNS",
  SCR = "SCR",
  COMP = "COMP",
  OBOL = "OBOL",
  SHU = "SHU",
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
