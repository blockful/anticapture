import { DaoIdEnum } from "@/shared/types/daos";
import { DelegateDelegationHistoryTable } from "@/features/holders-and-delegates/components/DelegateDelegationHistoryTable";
import { VotingPowerVariationGraph } from "@/features/holders-and-delegates/components/DelegatesDelegationHistory/VotingPowerVariationGraph";

interface DelegateDelegationsHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationsHistory = ({
  accountId,
  daoId,
}: DelegateDelegationsHistoryProps) => {
  return (
    <div className="bg-surface-default flex flex-col">
      {/* Graph Section */}
      <div className="flex-shrink-0 p-4 pb-2">
        <VotingPowerVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex flex-col">
        <DelegateDelegationHistoryTable accountId={accountId} daoId={daoId} />
      </div>
    </div>
  );
};
