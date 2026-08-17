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

// Comma-separated DAO ids hidden from the whole app (e.g. "SHU" or "shu,torn").
// The DAO's config and code paths stay in place, but it disappears from every
// list and its routes 404, so an environment can hide a DAO without deleting it.
// NEXT_PUBLIC_ so the value is inlined into the client bundle at build time.
const DISABLED_DAOS = new Set(
  (process.env.NEXT_PUBLIC_DISABLED_DAOS ?? "")
    .split(",")
    .map((daoId) => daoId.trim().toUpperCase())
    .filter(Boolean),
);

export const ALL_DAOS = Object.values(DaoIdEnum).filter(
  (daoId) => !DISABLED_DAOS.has(daoId),
);

export const isDaoIdEnum = (daoId: string): daoId is DaoIdEnum =>
  (ALL_DAOS as readonly string[]).includes(daoId);

export const toDaoIdEnum = (daoId: string): DaoIdEnum | null => {
  const normalizedDaoId = daoId.toUpperCase();

  return isDaoIdEnum(normalizedDaoId) ? normalizedDaoId : null;
};
