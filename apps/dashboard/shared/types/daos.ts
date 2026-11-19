export enum DaoIdEnum {
  AAVE = "AAVE",
  COMP = "COMP",
  ENS = "ENS",
  FLUID = "FLUID",
  LIL_NOUNS = "LIL_NOUNS",
  NOUNS = "NOUNS",
  // Retired 2026-11-19: the indexer is off and gateful no longer routes it.
  // SCROLL = "SCR",
  OBOL = "OBOL",
  SHU = "SHU",
  // OPTIMISM = "OP",
  UNISWAP = "UNI",
  GITCOIN = "GTC",
  TORN = "TORN",
}

export const ALL_DAOS = Object.values(DaoIdEnum);

export const isDaoIdEnum = (daoId: string): daoId is DaoIdEnum =>
  (ALL_DAOS as readonly string[]).includes(daoId);

export const toDaoIdEnum = (daoId: string): DaoIdEnum | null => {
  const normalizedDaoId = daoId.toUpperCase();

  return isDaoIdEnum(normalizedDaoId) ? normalizedDaoId : null;
};
