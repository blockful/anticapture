"use client";

import { ArrowDown, ArrowUp, Inbox } from "lucide-react";

import { useAccountInteractionsData } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/hooks/useAccountInteractionsData";
import { TopInteractionsChart } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/TopInteractionsChart";
import { TopInteractionsTable } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/TopInteractionsTable";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn, formatNumberUserReadable } from "@/shared/utils";

const ChartLegend = ({
  items,
  loading,
}: {
  items: { color: string; label: string; percentage: string }[];
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:justify-normal lg:gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="rounded-xs size-2"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-32"
            />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-secondary text-sm">No interactions found</div>;
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:justify-normal lg:gap-3">
      {items.map((item) => {
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="rounded-xs size-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-secondary flex flex-row gap-2 text-sm font-medium">
              {item.label}
              <span
                className="text-secondary text-sm font-medium"
                style={{
                  color: item.color,
                }}
              >
                {item.percentage}%
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const TopInteractions = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const {
    topFive,
    totalCount,
    legendItems,
    pieData,
    chartConfig,
    netBalanceChange,
    loading: loadingVotingPowerData,
  } = useAccountInteractionsData({ daoId, address });

  const variant = netBalanceChange >= 0 ? "positive" : "negative";

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
      {!topFive || (topFive.length === 0 && !loadingVotingPowerData) ? (
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No interactions found."
        />
      ) : (
        <div className="border-light-dark text-primary flex h-fit w-full shrink-0 flex-col gap-4 overflow-y-auto border p-4 lg:flex-row">
          <div className="flex h-full w-full flex-col">
            <div className="flex w-full flex-col gap-4 lg:flex-row">
              <div>
                {loadingVotingPowerData ? (
                  <SkeletonRow
                    parentClassName="flex animate-pulse"
                    className="h-40 w-40"
                  />
                ) : (
                  <TopInteractionsChart
                    currentValue={totalCount || 0}
                    pieData={pieData}
                    chartConfig={chartConfig}
                  />
                )}
              </div>

              <div className="flex w-full flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                    Net Tokens In/Out
                  </p>
                  <div className="text-md font-normal">
                    {!netBalanceChange || loadingVotingPowerData ? (
                      <SkeletonRow
                        parentClassName="justify-start flex animate-pulse items-start"
                        className="h-6 w-24"
                      />
                    ) : (
                      // this is inverted because is relative to the drawer address
                      // thus a positive value on the row means the drawer address is sending tokens
                      <p
                        className={cn(
                          "flex items-center text-sm font-normal",
                          variant !== "positive"
                            ? "text-success"
                            : "text-error",
                        )}
                      >
                        {netBalanceChange < 0 ? (
                          <ArrowUp
                            className={cn(
                              "size-4",
                              variant === "positive" && "text-success",
                            )}
                          />
                        ) : (
                          <ArrowDown
                            className={cn(
                              "size-4",
                              variant === "negative" && "text-error",
                            )}
                          />
                        )}
                        {formatNumberUserReadable(Math.abs(netBalanceChange))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="hidden h-px w-full bg-[#27272A] lg:flex" />

                <div className="hidden flex-col gap-2 lg:flex">
                  <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                    Top Interaction (by aggregated value)
                  </p>

                  <div className="scrollbar-none flex flex-col gap-4 overflow-y-auto">
                    <ChartLegend
                      items={legendItems}
                      loading={loadingVotingPowerData}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden">
        <TopInteractionsTable address={address} daoId={daoId} />
      </div>
    </div>
  );
};
