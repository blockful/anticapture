"use client";

import { useMemo } from "react";
import {
  useGetRevenueActions,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { cn } from "@/shared/utils/cn";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { transformToOverview } from "@/features/revenue/utils/transform";

const STREAM_DESCRIPTIONS: Record<string, string> = {
  Registration:
    "Base fees paid for new .eth registrations, including the base price of registrations that also paid a premium. Volume counts registrations that paid no premium; the average is this revenue ÷ every registration, with or without a premium.",
  Renewals:
    "Fees paid to extend existing .eth registrations. Volume counts paid renewals; the average is this revenue ÷ that count.",
  Premium:
    "The temporary, decaying surcharge for registering a recently released name. For the 2020 controller, which charged one combined price, the premium is that price minus the base rent at the oracle's ETH/USD rate. Volume counts registrations that paid one; the average is this revenue ÷ that count.",
};

export const RevenueOverviewCard = () => {
  const totalsQuery = useGetRevenueTotals("ens");
  const totals = useRevenueDataState(totalsQuery);
  const actionsQuery = useGetRevenueActions("ens");
  const actions = useRevenueDataState(actionsQuery);

  const isLoading = totals.isLoading || actions.isLoading;
  const isUnavailable = totals.isUnavailable || actions.isUnavailable;
  const overview = useMemo(
    () =>
      isLoading || isUnavailable
        ? null
        : transformToOverview(
            totals.items,
            actions.items,
            totals.cutoff,
            totals.cutoffKnown,
          ),
    [isLoading, isUnavailable, totals, actions],
  );

  if (isUnavailable) {
    return (
      <Card className="p-4">
        <UnavailableChart height={120} />
      </Card>
    );
  }

  return (
    <Card>
      {/* Stream columns — 1col mobile, 3col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "p-4",
                  index < 2 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <div className="bg-surface-raised h-2 w-full animate-pulse rounded" />
                <div className="bg-surface-raised mt-4 h-4 w-24 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-7 w-20 animate-pulse rounded" />
                <div className="bg-surface-raised mt-2 h-4 w-40 animate-pulse rounded" />
              </div>
            ))
          : overview?.streams.map((stream, index) => (
              <div
                key={stream.name}
                className={cn(
                  "p-4",
                  index < overview.streams.length - 1 &&
                    "border-border-default border-b lg:border-b-0 lg:border-r",
                )}
              >
                <ProgressBar
                  value={stream.sharePercent}
                  color={stream.color}
                  size="default"
                  rounded
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-secondary text-sm font-medium">
                      {stream.name}
                    </span>
                    <InfoTooltip>
                      {STREAM_DESCRIPTIONS[stream.name]} All time:{" "}
                      {overview.period}. Share = this stream ÷ total protocol
                      revenue.
                    </InfoTooltip>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: stream.color }}
                  >
                    {stream.share}
                  </span>
                </div>
                <p
                  className="mt-1 text-2xl font-medium"
                  style={{ color: stream.color }}
                >
                  {stream.amount}
                </p>
                <p className="text-secondary mt-1 text-sm">
                  {stream.volume}
                  <span className="mx-1.5">&middot;</span>
                  {stream.avgRevenue}
                </p>
              </div>
            ))}
      </div>
    </Card>
  );
};
