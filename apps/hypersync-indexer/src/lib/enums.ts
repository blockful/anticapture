export const DaoIdEnum = {
  AAVE: "AAVE",
  UNI: "UNI",
  ENS: "ENS",
  ARB: "ARB",
  OP: "OP",
  GTC: "GTC",
  NOUNS: "NOUNS",
  TEST: "TEST",
  SCR: "SCR",
  COMP: "COMP",
  OBOL: "OBOL",
  ZK: "ZK",
  SHU: "SHU",
  FLUID: "FLUID",
  LIL_NOUNS: "LIL_NOUNS",
} as const;

export type DaoIdEnum = (typeof DaoIdEnum)[keyof typeof DaoIdEnum];

export const SECONDS_IN_DAY = 24 * 60 * 60;
