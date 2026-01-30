"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import { DelegateDelegationHistoryTable } from "@/features/holders-and-delegates/delegate/drawer/delegation-history/DelegateDelegationHistoryTable";
import { VotingPowerVariationGraph } from "@/features/holders-and-delegates/delegate/drawer/delegation-history/VotingPowerVariationGraph";

interface DelegateDelegationsHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationsHistory = ({
  accountId,
  daoId,
}: DelegateDelegationsHistoryProps) => {
  return (
    <div className="bg-surface-default flex h-full flex-col overflow-hidden">
      {/* Graph Section */}
      <div className="shrink-0 p-4 pb-2">
        <VotingPowerVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DelegateDelegationHistoryTable accountId={accountId} daoId={daoId} />
      </div>
    </div>
  );
};
