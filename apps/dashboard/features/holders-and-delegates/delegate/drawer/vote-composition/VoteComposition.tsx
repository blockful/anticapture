"use client";

import {
  getNextPageParam,
  type FormerDelegatorsPathParamsDaoEnumKey,
} from "@anticapture/client";
import { useFormerDelegatorsInfinite } from "@anticapture/client/hooks";
import { useState } from "react";
import { formatUnits } from "viem";

import { FormerDelegatorsTable } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/FormerDelegatorsTable";
import { useVoteCompositionData } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/hooks/useVoteCompositionData";
import { ThePieChart } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/ThePieChart";
import { VoteCompositionTable } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/VoteCompositionTable";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

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
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="rounded-xs size-2"
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
    <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:justify-normal lg:gap-3">
      {items.length === 0 ? (
        <div className="text-secondary text-sm">No delegators found</div>
      ) : (
        items.map((item) => {
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
        })
      )}
    </div>
  );
};

export const VoteComposition = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const isAave = daoId === DaoIdEnum.AAVE;
  const [includeBalance, setIncludeBalance] = useState(false);
  const [view, setView] = useState<"current" | "former">("current");

  const {
    currentVotingPower,
    legendItems,
    pieData,
    chartConfig,
    loading: loadingVotingPowerData,
  } = useVoteCompositionData(daoId, address, includeBalance);

  const { decimals } = daoConfig[daoId];

  // Summary for the "Former Delegators" view. Shares the same query key as
  // FormerDelegatorsTable, so this only reads from cache (no extra request).
  // AAVE's API doesn't register this endpoint, so the toggle is hidden below
  // and `view` can never become "former" for it.
  const { data: formerData, hasNextPage: formerHasMorePages } =
    useFormerDelegatorsInfinite(
      daoId.toLowerCase() as FormerDelegatorsPathParamsDaoEnumKey,
      address,
      { limit: 20, orderDirection: "desc" },
      { query: { getNextPageParam, enabled: !isAave && view === "former" } },
    );
  const formerRows = (formerData?.pages ?? []).flatMap((page) => page.items);
  const formerTotalCount =
    formerData?.pages?.[0]?.totalCount ?? formerRows.length;
  const formerTotalVpLost = formerRows.reduce(
    (sum, item) =>
      sum + Number(formatUnits(BigInt(item.amount.toString()), decimals)),
    0,
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-secondary text-alternative-xs font-mono font-medium uppercase">
            {view === "current" ? "Current Voting Power" : "Total VP Lost"}
          </span>
          {view === "current" ? (
            !currentVotingPower ? (
              <SkeletonRow
                parentClassName="flex justify-start animate-pulse"
                className="h-6 w-24"
              />
            ) : (
              <span className="text-primary text-md font-normal">
                {formatNumberUserReadable(currentVotingPower)}
              </span>
            )
          ) : (
            <span className="text-primary text-md font-normal">
              {/* The sum only covers the pages already fetched while the count
                  covers every former delegator, so claim a total only once
                  there is nothing left to load. */}
              {!formerHasMorePages &&
                `${formatNumberUserReadable(formerTotalVpLost)} across `}
              {formerTotalCount}{" "}
              {formerTotalCount === 1 ? "address" : "addresses"}
            </span>
          )}
        </div>
        {!isAave && (
          <SegmentedControl
            value={view}
            onValueChange={(value) => setView(value as "current" | "former")}
            items={[
              { value: "current", label: "Current Delegators" },
              { value: "former", label: "Former Delegators" },
            ]}
          />
        )}
      </div>
      {view === "former" ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <FormerDelegatorsTable address={address} daoId={daoId} />
        </div>
      ) : (
        <>
          {isAave && (
            <div className="flex items-center gap-2 self-end">
              <span className="text-secondary text-xs font-medium">
                Include own balance
              </span>
              <button
                role="switch"
                aria-checked={includeBalance}
                onClick={() => setIncludeBalance((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  includeBalance ? "bg-orange-500" : "bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${
                    includeBalance ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}
          <div className="border-light-dark text-primary flex h-fit w-full shrink-0 flex-col gap-4 overflow-y-auto border p-4 lg:flex-row">
            <div className="flex h-full w-full flex-col">
              <div className="flex w-full flex-col gap-4 lg:flex-row">
                <div>
                  <ThePieChart
                    currentVotingPower={currentVotingPower}
                    pieData={pieData}
                    chartConfig={chartConfig}
                  />
                </div>

                <div className="flex w-full flex-col gap-6">
                  <div className="hidden flex-col gap-2 lg:flex">
                    <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                      Delegators
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
          <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden">
            <VoteCompositionTable address={address} daoId={daoId} />
          </div>
        </>
      )}
    </div>
  );
};
