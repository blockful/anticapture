"use client";

import { AlertCircle } from "lucide-react";

import { useInactiveVotingPowerSummary } from "@anticapture/client/hooks";
import type { InactiveVotingPowerSummaryPathParamsDaoEnumKey } from "@anticapture/client";
import type { DaoIdEnum } from "@/shared/types/daos";

interface InactiveDelegatesBannerProps {
  daoId: DaoIdEnum;
  fromDate?: number;
  toDate?: number;
}

// Alert banner summarizing how much delegated voting power sits with delegates
// that did not vote within the selected period (DEV-562 item 5 / #9).
export const InactiveDelegatesBanner = ({
  daoId,
  fromDate,
  toDate,
}: InactiveDelegatesBannerProps) => {
  const { data } = useInactiveVotingPowerSummary(
    daoId.toLowerCase() as InactiveVotingPowerSummaryPathParamsDaoEnumKey,
    {
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    },
  );

  const percentage = data ? Number(data.inactivePercentage) : 0;
  const totalProposals = data ? Number(data.totalProposals) : 0;

  // Nothing meaningful to warn about when there were no proposals in the
  // window or no VP is parked with inactive delegates.
  if (!data || totalProposals === 0 || percentage <= 0) return null;

  return (
    <div className="bg-surface-opacity-warning border-warning/30 flex items-start gap-2 rounded-lg border p-3">
      <AlertCircle className="text-warning mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="text-primary text-sm font-medium">
          {Math.round(percentage)}% of delegated voting power is assigned to
          inactive delegates.
        </p>
        <p className="text-secondary text-xs font-normal">
          Inactive = no votes cast in the selected period. Flagged rows below
          indicate holders whose delegate has not participated recently.
        </p>
      </div>
    </div>
  );
};
