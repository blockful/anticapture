import { DaoIdEnum } from "@/shared/types/daos";
import { DelegateDelegationHistoryTable } from "../DelegateDelegationHistoryTable";
import { VotingPowerVariationGraph } from "./VotingPowerVariationGraph";

interface DelegateDelegationsHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationsHistory = ({
  accountId,
  daoId,
}: DelegateDelegationsHistoryProps) => {
  return (
    <div className="bg-surface-default flex h-full flex-col">
      {/* Graph Section */}
      <div className="flex-shrink-0 p-4 pb-2">
        <VotingPowerVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex flex-1 flex-col">
        <DelegateDelegationHistoryTable accountId={accountId} daoId={daoId} />
      </div>
    </div>
  );
};
