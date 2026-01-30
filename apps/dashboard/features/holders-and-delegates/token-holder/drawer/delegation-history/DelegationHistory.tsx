"use client";

import { DelegationHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer/delegation-history/DelegationHistoryTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { useTableHeight } from "@/shared/hooks";

interface DelegationHistoryProps {
  address: string;
  daoId: DaoIdEnum;
}

export const DelegationHistory = ({
  address,
  daoId,
}: DelegationHistoryProps) => {
  const { containerRef, height, itemsPerPage } = useTableHeight({
    minHeight: 300,
    bottomOffset: 40,
    rowHeight: 52,
  });

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="flex w-full flex-col gap-4 overflow-hidden p-4"
    >
      <DelegationHistoryTable
        address={address}
        daoId={daoId}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
