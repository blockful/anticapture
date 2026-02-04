import { DaoIdEnum } from "@/shared/types/daos";
import { VotingPowerHistoryTable } from "@/features/holders-and-delegates/delegate/drawer/voting-power-history/VotingPowerHistoryTable";
import { VotingPowerVariationGraph } from "@/features/holders-and-delegates/delegate/drawer/voting-power-history/VotingPowerVariationGraph";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { getTimestampRangeFromPeriod } from "@/features/holders-and-delegates/utils";
import { TimePeriod } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";

interface VotingPowerHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const VotingPowerHistory = ({
  accountId,
  daoId,
}: VotingPowerHistoryProps) => {
  const [selectedPeriod] = useQueryState(
    "selectedPeriod",
    parseAsStringEnum<TimePeriod>(["30d", "90d", "all"]).withDefault("all"),
  );

  const { fromTimestamp, toTimestamp } = useMemo(
    () => getTimestampRangeFromPeriod(selectedPeriod),
    [selectedPeriod],
  );

  return (
    <div className="bg-surface-default flex h-full flex-col overflow-hidden">
      {/* Graph Section */}
      <div className="shrink-0 p-4 pb-2">
        <VotingPowerVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden p-4">
        <VotingPowerHistoryTable
          accountId={accountId}
          daoId={daoId}
          fromTimestamp={fromTimestamp}
          toTimestamp={toTimestamp}
        />
      </div>
    </div>
  );
};
