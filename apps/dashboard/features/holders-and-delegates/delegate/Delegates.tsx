"use client";

import type { VotingPowersQueryParamsOrderByEnumKey } from "@anticapture/client";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { Address } from "viem";
import { formatUnits, parseUnits } from "viem";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { DelegateButton } from "@/features/holders-and-delegates/delegate/DelegateButton";
import { ProgressCircle } from "@/features/holders-and-delegates/components/ProgressCircle";
import {
  getAvgVoteTimingData,
  DEFAULT_ITEMS_PER_PAGE,
} from "@/features/holders-and-delegates/utils";
import { SkeletonRow, Button, SimpleProgressBar } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import type { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import daoConfig from "@/shared/dao-config";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { useDao } from "@anticapture/client/hooks";
import type { DaoPathParamsDaoEnumKey } from "@anticapture/client";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

type ActivityStatus = "inactive" | "neverVoted" | "noProposals";

const AMOUNT_SORT_OPTIONS = [
  { value: "largest-first", label: "Largest first" },
  { value: "smallest-first", label: "Smallest first" },
];

interface DelegateTableData {
  address: string;
  votingPower: number;
  variation?: {
    percentageChange: number;
    absoluteChange: number;
  };
  activity?: string | null;
  activityPercentage?: number | null;
  activityStatus?: ActivityStatus | null;
  delegators: number;
  avgVoteTiming?: { text: string; percentage: number } | null;
}

const ACTIVITY_STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; className: string; tooltip: string }
> = {
  inactive: {
    label: "Inactive",
    className: "text-error",
    tooltip: "This delegate has not voted in the selected period.",
  },
  neverVoted: {
    label: "Never voted",
    className: "text-secondary",
    tooltip: "No proposals have been active since this delegate joined.",
  },
  noProposals: {
    label: "No proposals",
    className: "text-secondary",
    tooltip: "No proposals were active during this period.",
  },
};

interface DelegatesProps {
  fromDate?: number;
  toDate?: number;
  daoId: DaoIdEnum;
  isWhitelabel?: boolean;
}

type DelegateSortKey =
  | "delegationsCount"
  | "votingPower"
  | "signedVariation"
  | "variation";

export const Delegates = ({
  fromDate,
  toDate,
  daoId,
  isWhitelabel = false,
}: DelegatesProps) => {
  const pageLimit: number = 20;

  const [drawerAddress, setDrawerAddress] = useQueryState("drawerAddress");
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("address");
  const [sortOrder, setSortOrder] = useQueryState(
    "sort",
    parseAsStringEnum(["desc", "asc"]).withDefault("desc"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum([
      "delegationsCount",
      "votingPower",
      "signedVariation",
      "variation",
    ]).withDefault("votingPower" as DelegateSortKey),
  );
  const [minValue, setMinValue] = useQueryState("minValue");
  const [maxValue, setMaxValue] = useQueryState("maxValue");
  const { decimals } = daoConfig[daoId];
  const { data: daoData } = useDao(
    daoId.toLowerCase() as DaoPathParamsDaoEnumKey,
  );

  // API expects raw token units; URL values are human-readable and user-editable
  const toRawUnits = (value: string | null): string | undefined => {
    if (!value) return undefined;
    try {
      return parseUnits(value, decimals).toString();
    } catch {
      return undefined;
    }
  };

  const quorum = useMemo(() => {
    if (!daoData?.quorum) return 0;
    return Number(formatUnits(BigInt(daoData.quorum.toString()), decimals));
  }, [daoData?.quorum, decimals]);

  const votingPeriodSeconds = useMemo(() => {
    if (!daoData?.votingPeriod) return 0;
    const blockTime = daoConfig[daoId].daoOverview.chain.blockTime;
    return (Number(daoData.votingPeriod) * blockTime) / 1000;
  }, [daoData?.votingPeriod, daoId]);

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

  const orderByMap: Record<
    DelegateSortKey,
    VotingPowersQueryParamsOrderByEnumKey
  > = {
    delegationsCount: "delegationsCount",
    votingPower: "votingPower",
    signedVariation: "signedVariation",
    variation: "variation",
  };

  const {
    data,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    fetchingMore,
    isActivityLoadingFor,
  } = useDelegates({
    orderBy: orderByMap[sortBy],
    orderDirection: sortOrder,
    daoId,
    fromDate,
    toDate,
    address: currentAddressFilter || undefined,
    limit: pageLimit,
    fromValue: toRawUnits(minValue),
    toValue: toRawUnits(maxValue),
  });

  const { isMobile } = useScreenSize();

  // Handle sorting for voting power and delegators
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for votingPower, asc for delegationsCount
      setSortBy(field as DelegateSortKey);
      setSortOrder(field === "delegationsCount" ? "asc" : "desc");
    }
  };

  // Cycles: no-arrow (votingPower desc) → down-arrow (signed variation desc) → up-arrow (signed variation asc) → both-arrows (variation desc) → no-arrow
  const handleVariationSort = () => {
    if (sortBy === "signedVariation" && sortOrder === "desc") {
      setSortOrder("asc");
    } else if (sortBy === "signedVariation" && sortOrder === "asc") {
      setSortBy("variation");
      setSortOrder("desc");
    } else if (sortBy === "variation") {
      setSortBy("votingPower");
      setSortOrder("desc");
    } else {
      setSortBy("signedVariation");
      setSortOrder("desc");
    }
  };

  const tableData = useMemo(() => {
    if (!data) return [];

    return data.map((delegate): DelegateTableData => {
      const votingPowerBigInt = BigInt(delegate.votingPower || "0");
      const votingPowerFormatted = Number(
        formatUnits(votingPowerBigInt, decimals),
      );

      const proposalsActivity = delegate.proposalsActivity;

      const activity = proposalsActivity
        ? `${proposalsActivity.votedProposals}/${proposalsActivity.totalProposals}`
        : null;

      const activityPercentage =
        proposalsActivity && proposalsActivity.totalProposals > 0
          ? (proposalsActivity.votedProposals /
              proposalsActivity.totalProposals) *
            100
          : null;

      const activityStatus: ActivityStatus | null = proposalsActivity
        ? proposalsActivity.totalProposals > 0
          ? proposalsActivity.votedProposals === 0
            ? "inactive"
            : null
          : proposalsActivity.neverVoted
            ? "neverVoted"
            : "noProposals"
        : null;

      const avgVoteTiming = getAvgVoteTimingData(
        delegate.proposalsActivity?.avgTimeBeforeEnd,
        votingPeriodSeconds,
        delegate.proposalsActivity?.votedProposals,
      );

      return {
        address: delegate.accountId,
        votingPower: votingPowerFormatted,
        variation: {
          percentageChange:
            delegate.variation.percentageChange === PERCENTAGE_NO_BASELINE
              ? 9999
              : Number(Number(delegate.variation.percentageChange).toFixed(2)),
          absoluteChange: Number(
            formatUnits(BigInt(delegate.variation.absoluteChange), decimals),
          ),
        },
        activity,
        activityPercentage,
        activityStatus,
        delegators: delegate.delegationsCount,
        avgVoteTiming,
      };
    });
  }, [data, decimals, votingPeriodSeconds]);

  const delegateColumns: ColumnDef<DelegateTableData>[] = [
    {
      accessorKey: "address",
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        if (loading) {
          return (
            <div className="flex items-center gap-3">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="size-6 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="group flex w-40 items-center lg:w-full">
            <div className="min-w-0 flex-1">
              <EnsAvatar
                address={address as Address}
                size="sm"
                variant="rounded"
                isDashed={true}
                nameClassName="[tr:hover_&]:border-primary"
              />
            </div>
            {!isMobile && (
              <div className="flex items-center opacity-0 transition-opacity [tr:hover_&]:opacity-100">
                <CopyAndPasteButton
                  textToCopy={address as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="mx-1 p-1"
                  iconSize="md"
                />
                <Button
                  data-ph-event="delegate_details"
                  data-ph-source="delegates_table"
                  data-umami-event="delegate_details"
                  variant="outline"
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  <span className="text-sm font-medium">Details</span>
                </Button>
              </div>
            )}
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter || undefined}
          />
        </div>
      ),
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "votingPower",
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as number;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse w-full items-center justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        const quorumPercentage = quorum > 0 ? (votingPower / quorum) * 100 : 0;

        return (
          <div className="flex w-full flex-col items-end justify-center text-end">
            <span className="text-primary text-sm font-normal">
              {formatNumberUserReadable(votingPower)}
            </span>
            {quorumPercentage >= 50 && (
              <span
                className={cn(
                  "text-xs font-normal",
                  quorumPercentage >= 100 ? "text-error" : "text-warning",
                )}
              >
                {Math.round(quorumPercentage)}% of quorum
              </span>
            )}
          </div>
        );
      },
      header: () => (
        <div className="flex w-full items-center justify-end gap-1.5">
          <h4 className="text-table-header whitespace-nowrap">
            Voting Power ({daoId})
          </h4>
          <AmountFilter
            filterId="delegates-voting-power-filter"
            sortOptions={AMOUNT_SORT_OPTIONS}
            onApply={(filterState: AmountFilterState) => {
              if (filterState.sortOrder) {
                setSortBy("votingPower");
                setSortOrder(
                  filterState.sortOrder === "largest-first" ? "desc" : "asc",
                );
              }
              setMinValue(filterState.minAmount || null);
              setMaxValue(filterState.maxAmount || null);
            }}
            onReset={() => {
              setMinValue(null);
              setMaxValue(null);
              setSortBy("votingPower");
              setSortOrder("desc");
            }}
            isActive={!!(minValue || maxValue)}
          />
        </div>
      ),
      meta: {
        columnClassName: "w-[15%]",
      },
    },
    {
      accessorKey: "variation",
      cell: ({ row }) => {
        const variation = row.getValue("variation") as
          | {
              percentageChange: number;
              absoluteChange: number;
            }
          | undefined;

        if (loading) {
          return (
            <div className="flex w-full items-center justify-center">
              <SkeletonRow
                className="h-4 w-16"
                parentClassName="flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full flex-col items-end justify-center text-end text-sm">
            <span className="text-primary tabular-nums">
              {(variation?.percentageChange || 0) < 0 ? "-" : ""}
              {formatNumberUserReadable(
                Math.abs(variation?.absoluteChange || 0),
              )}
            </span>
            <Percentage
              className="text-xs"
              iconPosition="right"
              value={variation?.percentageChange || 0}
            />
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={handleVariationSort}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Change ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "signedVariation"
                ? sortOrder === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.UP
                : sortBy === "variation"
                  ? ArrowState.BOTH
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-[16%]",
      },
    },
    {
      accessorKey: "activity",
      cell: ({ row }) => {
        const activity = row.getValue("activity") as string | undefined;
        const { activityPercentage, activityStatus } = row.original;
        const addr = row.original.address;
        if (isActivityLoadingFor(addr) || loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-10" />
            </div>
          );
        }

        const status = activityStatus
          ? ACTIVITY_STATUS_CONFIG[activityStatus]
          : null;
        const [votedCount, totalCount] = (activity || "0/0").split("/");

        const content = (
          <div className="flex items-center justify-start gap-2">
            <ProgressCircle percentage={activityPercentage || 0} />
            <div className="flex flex-col items-start justify-center text-left">
              <span className="text-sm">
                {Number(totalCount) > 0 ? (
                  <>
                    <span className="text-primary">{votedCount}</span>
                    <span className="text-secondary">/{totalCount}</span>
                  </>
                ) : (
                  <span className="text-secondary">0/0</span>
                )}
              </span>
              {status && (
                <span className={cn("text-xs font-normal", status.className)}>
                  {status.label}
                </span>
              )}
            </div>
          </div>
        );

        return status ? (
          <Tooltip tooltipContent={status.tooltip}>{content}</Tooltip>
        ) : (
          content
        );
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Activity
        </h4>
      ),
      meta: {
        columnClassName: "w-[11%]",
      },
    },
    {
      accessorKey: "avgVoteTiming",
      cell: ({ row }) => {
        const avgVoteTiming = row.getValue("avgVoteTiming") as {
          text: string;
          percentage: number;
        } | null;

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        if (!avgVoteTiming) {
          return <div className="text-secondary text-sm">-</div>;
        }

        return (
          <div className="flex flex-col justify-center gap-1">
            <div
              className={cn("text-secondary text-xs font-normal", {
                "text-end text-sm": avgVoteTiming.text === "-",
              })}
            >
              {avgVoteTiming.text}
            </div>
            {avgVoteTiming.text !== "-" && (
              <SimpleProgressBar percentage={avgVoteTiming.percentage} />
            )}
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-1.5">
          <Tooltip tooltipContent="Measures the average of how close to the proposal deadline a vote is cast. Delegates who vote late may be influenced by prior votes or ongoing discussion.">
            <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
              Avg Vote Timing
            </h4>
          </Tooltip>
        </div>
      ),
      meta: {
        columnClassName: "w-[16%]",
      },
    },
    {
      accessorKey: "delegators",
      cell: ({ row }) => {
        const delegators = row.getValue("delegators") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex items-center justify-start text-end text-sm font-normal">
            {delegators}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => handleSort("delegationsCount")}
        >
          <h4 className="text-table-header">Delegators</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "delegationsCount"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-[12%]",
      },
    },
    ...(isWhitelabel
      ? [
          {
            id: "delegate",
            cell: ({
              row,
            }: {
              row: { getValue: (key: string) => unknown };
            }) => {
              const address = row.getValue("address") as string | undefined;
              if (!address) return null;
              return (
                <div
                  className="flex items-center justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DelegateButton
                    delegateAddress={address as Address}
                    daoId={daoId}
                    size="sm"
                    variant="outline"
                  />
                </div>
              );
            },
            header: () => null,
            meta: {
              columnClassName: "w-18",
            },
          } satisfies ColumnDef<DelegateTableData>,
        ]
      : []),
  ];

  return (
    <>
      <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col">
        <Table
          columns={delegateColumns}
          data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
          onRowClick={(row) => setDrawerAddress(row.address as Address)}
          withRowBorders
          hasMore={hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          withDownloadCSV={true}
          csvFilename="delegates.csv"
          error={error}
          fillHeight
        />
      </div>
      <HoldersAndDelegatesDrawer
        isOpen={!!drawerAddress}
        onClose={() => setDrawerAddress(null)}
        entityType="delegate"
        address={drawerAddress || ""}
        daoId={daoId}
      />
    </>
  );
};
