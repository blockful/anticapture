import type { DaoIdEnum } from "@/shared/types/daos";

/**
 * Whether a DAO's API serves an endpoint, read from the generated path-param
 * enum of that endpoint (e.g. `proposalsActivityPathParamsDaoEnum`). Saves a
 * request that would only come back as an error.
 */
export const isServedBy = (
  daoEnum: Readonly<Record<string, string>>,
  daoId: DaoIdEnum,
) => Object.values(daoEnum).includes(daoId.toLowerCase());
