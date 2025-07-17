"use client";

import { ThePieChart } from "@/features/holders-and-delegates/delegate/drawer/voting-power/ThePieChart";
import { VotingPowerTable } from "@/features/holders-and-delegates/delegate/drawer/voting-power/VotingPowerTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { useVotingPowerData } from "./hooks/useVotingPowerData";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { BlankState } from "@/shared/components/design-system/blank-state/BlankState";
import { Inbox } from "lucide-react";

const ChartLegend = ({
  items,
  loading,
}: {
  items: { color: string; label: string; percentage: string }[];
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-2 rounded-xs"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-16"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
      {items.map((item) => {
        if (Number(item.percentage) < 1 && item.label !== "Others") return null;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="size-2 rounded-xs"
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

export const VotingPower = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const {
    topFiveDelegators,
    currentVotingPower,
    legendItems,
    pieData,
    chartConfig,
    loading: loadingVotingPowerData,
  } = useVotingPowerData(daoId, address);
  const { pagination, fetchPreviousPage, fetchNextPage, fetchingMore } =
    useVotingPower({
      daoId,
      address: address,
    });

  if (
    !topFiveDelegators ||
    (topFiveDelegators.length === 0 && !loadingVotingPowerData)
  ) {
    return (
      <BlankState
        variant="default"
        icon={Inbox}
        description="No delegators found"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="border-light-dark text-primary flex h-fit w-full flex-col gap-4 overflow-y-auto border p-4 sm:flex-row">
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full flex-row gap-4">
            <div>
              <ThePieChart
                currentVotingPower={currentVotingPower}
                pieData={pieData}
                chartConfig={chartConfig}
              />
            </div>

            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Current Voting Power
                </p>
                <p className="text-md font-normal">
                  {!currentVotingPower ? (
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-6 w-24"
                    />
                  ) : (
                    formatNumberUserReadable(currentVotingPower)
                  )}
                </p>
              </div>

              <div className="h-px w-full bg-[#27272A]" />

              {/* Delegators */}
              <div className="flex flex-col gap-2">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Delegators
                </p>

                <div className="scrollbar-none flex flex-col gap-4 overflow-y-auto">
                  {!legendItems || !topFiveDelegators ? (
                    <ChartLegend items={[]} loading={true} />
                  ) : !topFiveDelegators ? (
                    <div className="text-secondary text-sm">
                      Loading delegators...
                    </div>
                  ) : topFiveDelegators && topFiveDelegators.length > 0 ? (
                    <ChartLegend items={legendItems} />
                  ) : (
                    <div className="text-secondary text-sm">
                      No delegators found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <VotingPowerTable address={address} daoId={daoId} />
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPrevious={fetchPreviousPage}
          onNext={fetchNextPage}
          className="text-white"
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          isLoading={fetchingMore}
        />
      </div>
    </div>
  );
};
