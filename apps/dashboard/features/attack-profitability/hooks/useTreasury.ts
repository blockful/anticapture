import {
  useGetDaoTokenTreasury,
  useGetLiquidTreasury,
  useGetTotalTreasury,
} from "@anticapture/client/hooks";
import type {
  GetLiquidTreasuryPathParamsDaoEnumKey,
  TreasuryItem,
} from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums/TimeInterval";

export type TreasuryType = "liquid" | "dao-token" | "total";

export interface TreasuryDataPoint {
  value: number;
  date: number;
}

export const useTreasury = (
  daoId: DaoIdEnum,
  type: TreasuryType = "total",
  days: TimeInterval = "365d" as TimeInterval,
  order: "asc" | "desc" = "asc",
) => {
  const dao = daoId.toLowerCase() as GetLiquidTreasuryPathParamsDaoEnumKey;
  const params = { days, orderDirection: order };

  const liquid = useGetLiquidTreasury(dao, params, {
    query: { enabled: type === "liquid" },
  });
  const daoToken = useGetDaoTokenTreasury(dao, params, {
    query: { enabled: type === "dao-token" },
  });
  const total = useGetTotalTreasury(dao, params, {
    query: { enabled: type === "total" },
  });

  const active =
    type === "liquid" ? liquid : type === "dao-token" ? daoToken : total;

  return {
    data: (active.data?.items ?? []) as TreasuryItem[],
    totalCount: active.data?.totalCount ?? 0,
    loading: active.isLoading,
    error: active.error,
  };
};
