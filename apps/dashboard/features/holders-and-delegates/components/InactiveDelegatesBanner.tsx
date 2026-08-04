"use client";

import { useInactiveVotingPowerSummary } from "@anticapture/client/hooks";
import type { InactiveVotingPowerSummaryPathParamsDaoEnumKey } from "@anticapture/client";
import { InlineAlert } from "@/shared/components/design-system/alerts";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
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
      ...(fromDate != null ? { fromDate } : {}),
      ...(toDate != null ? { toDate } : {}),
    },
  );

  const percentage = data ? Number(data.inactivePercentage) : 0;
  const totalProposals = data ? Number(data.totalProposals) : 0;

  if (!data || totalProposals === 0 || percentage <= 0) return null;

  return (
    <InlineAlert
      variant="warning"
      text={
        <span className="text-primary text-sm font-medium">
          {Math.round(percentage)}% of delegated voting power is assigned to{" "}
          <Tooltip
            tooltipContent="No votes cast in the selected period."
            triggerClassName="underline decoration-dashed underline-offset-2 cursor-help"
          >
            inactive
          </Tooltip>{" "}
          delegates.
        </span>
      }
    />
  );
};
