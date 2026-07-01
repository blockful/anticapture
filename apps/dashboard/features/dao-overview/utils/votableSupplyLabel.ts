import { DaoIdEnum } from "@/shared/types/daos";

export const getVotableSupplyLabel = (daoId: string) =>
  daoId === DaoIdEnum.TORN ? "locked" : "delegated";
