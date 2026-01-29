"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import { BalanceHistoryVariationGraph } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistoryVariationGraph";
import { BalanceHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistoryTable";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

interface BalanceHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const BalanceHistory = ({ accountId, daoId }: BalanceHistoryProps) => {
  const [selectedPeriod] = useQueryState(
    "selectedPeriod",
    parseAsStringEnum(["30d", "90d", "all"]).withDefault("all"),
  );

  const { fromTimestamp, toTimestamp } = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;

    if (selectedPeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    let daysInSeconds: number;
    switch (selectedPeriod) {
      case "90d":
        daysInSeconds = 90 * SECONDS_PER_DAY;
        break;
      default:
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    return {
      fromTimestamp: Math.floor(nowInSeconds - daysInSeconds),
      toTimestamp: Math.floor(nowInSeconds),
    };
  }, [selectedPeriod]);

  return (
    <div className="bg-surface-default flex flex-col">
      {/* Graph Section */}
      <div className="shrink-0 p-4 pb-2">
        <BalanceHistoryVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex w-full flex-col gap-2 p-4">
        <BalanceHistoryTable
          accountId={accountId}
          daoId={daoId}
          fromTimestamp={fromTimestamp}
          toTimestamp={toTimestamp}
        />
      </div>
    </div>
  );
};
