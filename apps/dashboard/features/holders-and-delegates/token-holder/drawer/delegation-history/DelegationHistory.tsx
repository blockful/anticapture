"use client";

import { DelegationHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer/delegation-history/DelegationHistoryTable";
import { DaoIdEnum } from "@/shared/types/daos";

interface DelegationHistoryProps {
  address: string;
  daoId: DaoIdEnum;
}

export const DelegationHistory = ({
  address,
  daoId,
}: DelegationHistoryProps) => {
  return (
    <div className="flex w-full flex-1 flex-col gap-4 overflow-hidden p-4">
      <DelegationHistoryTable address={address} daoId={daoId} />
    </div>
  );
};
