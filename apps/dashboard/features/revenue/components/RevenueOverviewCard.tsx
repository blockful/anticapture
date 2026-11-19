"use client";

import { useMemo } from "react";
import {
  useGetRevenueActions,
  useGetRevenueTotals,
} from "@anticapture/client/hooks";

import { DeepLinkTitle } from "@/shared/components/deep-link";
import { Card } from "@/shared/components/design-system/cards/card/Card";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { cn } from "@/shared/utils/cn";
import { deepLinkTarget } from "@/shared/utils/deepLink";

import { InfoTooltip } from "@/features/revenue/components/InfoTooltip";
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import { UnavailableChart } from "@/features/revenue/components/UnavailableChart";
import { useRevenueDataState } from "@/features/revenue/hooks/useRevenueDataState";
import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";
import { transformToOverview } from "@/features/revenue/utils/transform";

const SHARE_FORMULA = code("share = stream revenue ÷ total revenue × 100");

/** Definition, then the formulas of the share and of the average. */
const STREAM_DESCRIPTIONS: Record<string, string> = {
  Registration: paragraphs(
    "Base fees paid for new .eth registrations, including the base price of registrations that also paid a premium. Volume counts registrations that paid no premium.",
    `Formulas: ${SHARE_FORMULA} and ${code("average = stream revenue ÷ every registration")}, with or without a premium.`,
  ),
  Renewals: paragraphs(
    "Fees paid to extend existing .eth registrations. Volume counts paid renewals.",
    `Formulas: ${SHARE_FORMULA} and ${code("average = stream revenue ÷ paid renewals")}`,
  ),
  Premium: paragraphs(
    "The temporary, decaying surcharge for registering a recently released name. Volume counts registrations that paid one.",
    `Formulas: ${SHARE_FORMULA} and ${code("average = stream revenue ÷ registrations with a premium")}`,
    "For the 2020 controller, which charged one combined price, the premium is that price minus the base rent at the oracle's ETH/USD rate.",
  ),
};

/** The streams, in the order of the columns, and the block each one links to. */
const STREAMS = [
  { name: "Registration", anchor: REVENUE_ANCHORS.registrationRevenue },
  { name: "Renewals", anchor: REVENUE_ANCHORS.renewalRevenue },
  { name: "Premium", anchor: REVENUE_ANCHORS.premiumRevenue },
];

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
        {STREAMS.map(({ name, anchor }, index) => {
          const stream = overview?.streams.find((item) => item.name === name);
          return (
            // The column is on the page while it loads, so a link to it has
            // somewhere to land before the data arrives.
            <div
              key={name}
              {...deepLinkTarget(anchor)}
              className={cn(
                "p-4",
                index < STREAMS.length - 1 &&
                  "border-border-default border-b lg:border-b-0 lg:border-r",
              )}
            >
              {isLoading ? (
                <>
                  <div className="bg-surface-raised h-2 w-full animate-pulse rounded" />
                  <div className="bg-surface-raised mt-4 h-4 w-24 animate-pulse rounded" />
                  <div className="bg-surface-raised mt-2 h-7 w-20 animate-pulse rounded" />
                  <div className="bg-surface-raised mt-2 h-4 w-40 animate-pulse rounded" />
                </>
              ) : overview && stream ? (
                <>
                  <ProgressBar
                    value={stream.sharePercent}
                    color={stream.color}
                    size="default"
                    rounded
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <DeepLinkTitle
                      slug={anchor}
                      info={
                        <InfoTooltip>
                          {paragraphs(
                            STREAM_DESCRIPTIONS[stream.name],
                            `Window: all time, ${overview.period}.`,
                          )}
                        </InfoTooltip>
                      }
                    >
                      {stream.name}
                    </DeepLinkTitle>
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
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
