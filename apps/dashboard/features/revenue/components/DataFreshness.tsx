"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import {
  useGetRevenueActions,
  useGetRevenueActiveNames,
  useGetRevenueEnsv2Daily,
  useGetRevenueNewWallets,
  useGetRevenueRenewalFunnel,
  useGetRevenueRenewalTenure,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

import { formatUtcDateTime } from "@/features/revenue/utils/format";
import {
  DATA_DELAYED_AFTER_HOURS,
  readRevenueMeta,
  summarizeFreshness,
} from "@/features/revenue/utils/meta";

/**
 * "Data as of <date> UTC" for the revenue section, plus a "Data delayed"
 * badge when the data is older than 36 hours. Hidden until the API reports
 * freshness metadata. Shares the cards' queries (React Query dedupes them).
 */
export const DataFreshness = () => {
  const totals = useGetRevenueTotals("ens").data;
  const actions = useGetRevenueActions("ens").data;
  const newWallets = useGetRevenueNewWallets("ens").data;
  const funnel = useGetRevenueRenewalFunnel("ens").data;
  const activeNames = useGetRevenueActiveNames("ens").data;
  const tenure = useGetRevenueRenewalTenure("ens").data;
  const ensv2 = useGetRevenueEnsv2Daily("ens").data;

  const freshness = useMemo(
    () =>
      summarizeFreshness(
        [totals, actions, newWallets, funnel, activeNames, tenure, ensv2].map(
          readRevenueMeta,
        ),
      ),
    [totals, actions, newWallets, funnel, activeNames, tenure, ensv2],
  );

  if (!freshness.reported) return null;

  return (
    <div className="text-secondary flex flex-wrap items-center gap-2 text-sm">
      <Clock className="size-3.5" />
      <span>
        {freshness.asOf
          ? `Data as of ${formatUtcDateTime(freshness.asOf)}`
          : "Data as of: unknown"}
      </span>
      {freshness.delayed && (
        <Tooltip
          asChild
          tooltipContent={
            <p className="text-secondary text-left text-sm font-normal leading-5">
              This data is more than {DATA_DELAYED_AFTER_HOURS} hours old.
              Figures cover activity up to the time above; anything after it is
              not included yet.
            </p>
          }
          triggerClassName="cursor-help"
        >
          <span>
            <BadgeStatus variant="warning">Data delayed</BadgeStatus>
          </span>
        </Tooltip>
      )}
    </div>
  );
};
