"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import { BalanceHistoryVariationGraph } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistoryVariationGraph";
import { BalanceHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistoryTable";
import { useTableHeight } from "@/shared/hooks";

interface BalanceHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const BalanceHistory = ({ accountId, daoId }: BalanceHistoryProps) => {
  const { containerRef, height, itemsPerPage } = useTableHeight({
    minHeight: 300,
    bottomOffset: 40,
    rowHeight: 52,
  });

  return (
    <div className="bg-surface-default flex h-full flex-col overflow-hidden">
      {/* Graph Section */}
      <div className="shrink-0 p-4 pb-2">
        <BalanceHistoryVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div
        ref={containerRef}
        style={{ height }}
        className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden p-4"
      >
        <BalanceHistoryTable
          accountId={accountId}
          daoId={daoId}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};
