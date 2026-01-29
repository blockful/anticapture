import { DaoIdEnum } from "@/shared/types/daos";
import { DelegateDelegationHistoryTable } from "@/features/holders-and-delegates/delegate/drawer/delegation-history/DelegateDelegationHistoryTable";
import { VotingPowerVariationGraph } from "@/features/holders-and-delegates/delegate/drawer/delegation-history/VotingPowerVariationGraph";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

interface DelegateDelegationsHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationsHistory = ({
  accountId,
  daoId,
}: DelegateDelegationsHistoryProps) => {
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
        <VotingPowerVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex flex-col">
        <DelegateDelegationHistoryTable
          accountId={accountId}
          daoId={daoId}
          fromTimestamp={fromTimestamp}
          toTimestamp={toTimestamp}
        />
      </div>
    </div>
  );
};
