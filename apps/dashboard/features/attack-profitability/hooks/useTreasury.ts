import {
  DaysWindow,
  OrderDirection,
  type DaoTokenTreasuryQuery,
  type LiquidTreasuryQuery,
  type TotalTreasuryQuery,
  useDaoTokenTreasuryQuery,
  useLiquidTreasuryQuery,
  useTotalTreasuryQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums/TimeInterval";

export type TreasuryType = "liquid" | "dao-token" | "total";

export interface TreasuryDataPoint {
  value: number;
  date: number;
}

type TreasuryQueryResult =
  | LiquidTreasuryQuery["getLiquidTreasury"]
  | DaoTokenTreasuryQuery["getDaoTokenTreasury"]
  | TotalTreasuryQuery["getTotalTreasury"];

const useQueryByType = (
  type: TreasuryType,
  daoId: DaoIdEnum,
  days: TimeInterval,
  order: "asc" | "desc",
) => {
  const daysKey = days as keyof typeof DaysWindow;
  const commonOptions = {
    variables: {
      days: DaysWindow[daysKey],
      orderDirection:
        order === "asc" ? OrderDirection.Asc : OrderDirection.Desc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  };

  const liquid = useLiquidTreasuryQuery({
    ...commonOptions,
    skip: type !== "liquid",
    fetchPolicy: "no-cache",
  });

  const daoToken = useDaoTokenTreasuryQuery({
    ...commonOptions,
    skip: type !== "dao-token",
    fetchPolicy: "no-cache",
  });

  const total = useTotalTreasuryQuery({
    ...commonOptions,
    skip: type !== "total",
    fetchPolicy: "no-cache",
  });

  if (type === "liquid") return liquid;
  if (type === "dao-token") return daoToken;
  return total;
};

const extractTreasuryData = (
  type: TreasuryType,
  data: ReturnType<typeof useQueryByType>["data"],
): TreasuryQueryResult | null => {
  if (!data) return null;
  if (type === "liquid" && "getLiquidTreasury" in data)
    return (data as LiquidTreasuryQuery).getLiquidTreasury;
  if (type === "dao-token" && "getDaoTokenTreasury" in data)
    return (data as DaoTokenTreasuryQuery).getDaoTokenTreasury;
  if (type === "total" && "getTotalTreasury" in data)
    return (data as TotalTreasuryQuery).getTotalTreasury;
  return null;
};

export const useTreasury = (
  daoId: DaoIdEnum,
  type: TreasuryType = "total",
  days: TimeInterval = "365d" as TimeInterval,
  order: "asc" | "desc" = "asc",
) => {
  const { data, loading, error } = useQueryByType(type, daoId, days, order);
  const treasury = extractTreasuryData(type, data);

  return {
    data: treasury?.items ?? [],
    totalCount: treasury?.totalCount ?? 0,
    loading,
    error,
  };
};
