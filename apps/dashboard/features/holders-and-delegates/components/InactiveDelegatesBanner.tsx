"use client";

import { useInactiveVotingPowerSummary } from "@anticapture/client/hooks";
import type { InactiveVotingPowerSummaryPathParamsDaoEnumKey } from "@anticapture/client";
import { InlineAlert } from "@/shared/components/design-system/alerts";
import type { DaoIdEnum } from "@/shared/types/daos";

interface InactiveDelegatesBannerProps {
  daoId: DaoIdEnum;
  fromDate?: number;
  toDate?: number;
}

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

  if (!data || totalProposals === 0 || percentage <= 0) return null;

  return (
    <InlineAlert
      variant="warning"
      text={
        <span className="flex flex-col gap-0.5">
          <span className="text-primary text-sm font-medium">
            {Math.round(percentage)}% of delegated voting power is assigned to
            inactive delegates.
          </span>
          <span className="text-secondary text-xs font-normal">
            Inactive = no votes cast in the selected period. Flagged rows below
            indicate holders whose delegate has not participated recently.
          </span>
        </span>
      }
    />
  );
};
