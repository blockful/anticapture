"use client";

import { QueryInput_VotingPowers_OrderBy } from "@anticapture/graphql-client";
import type { QueryInput_VotingPowers_OrderDirection } from "@anticapture/graphql-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";

import { useGetTokenHoldersQuery } from "@anticapture/graphql-client/hooks";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { SkeletonRow } from "@/shared/components/skeletons";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getAuthHeaders } from "@/shared/utils/server-utils";

interface DelegateTableData {
  address: string;
  votingPower: string;
  balance: string;
  total: string;
  variation?: {
    percentageChange: number;
    absoluteChange: number;
  };
  delegators: number;
}

export function DelegationTable() {
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
      "total",
      "balance",
    ]).withDefault("votingPower"),
  );
  const daoId = DaoIdEnum.AAVE;
  const decimals = 18;

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

  type DelegateSortKey =
    | "delegationsCount"
    | "votingPower"
    | "signedVariation"
    | "variation"
    | "total"
    | "balance";

  const orderByMap: Record<DelegateSortKey, QueryInput_VotingPowers_OrderBy> = {
    delegationsCount: QueryInput_VotingPowers_OrderBy.DelegationsCount,
    votingPower: QueryInput_VotingPowers_OrderBy.VotingPower,
    signedVariation: QueryInput_VotingPowers_OrderBy.SignedVariation,
    variation: QueryInput_VotingPowers_OrderBy.Variation,
    total: QueryInput_VotingPowers_OrderBy.VotingPower,
    balance: QueryInput_VotingPowers_OrderBy.VotingPower,
  };

  const { data, loading, error, pagination, fetchNextPage, fetchingMore } =
    useDelegates({
      orderBy: orderByMap[sortBy as DelegateSortKey],
      orderDirection: sortOrder as QueryInput_VotingPowers_OrderDirection,
      daoId,
      days: TimeInterval.THIRTY_DAYS,
      address: currentAddressFilter || undefined,
      limit: pageLimit,
      skipActivity: true,
    });

  const delegateAddresses = useMemo(
    () => data?.map((d) => d.accountId) || [],
    [data],
  );

  const { data: balancesData } = useGetTokenHoldersQuery({
    variables: {
      addresses: delegateAddresses,
      limit: delegateAddresses.length || 1,
    },
    context: {
      headers: { "anticapture-dao-id": daoId, ...getAuthHeaders() },
    },
    skip: delegateAddresses.length === 0,
  });

  const { isMobile } = useScreenSize();

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
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
      const combinedPowerBigInt = BigInt(delegate.votingPower || "0");
      const combinedPowerFormatted = Number(
        formatUnits(combinedPowerBigInt, decimals),
      );

      const balanceItem = balancesData?.accountBalances?.items?.find(
        (item) => item?.address === delegate.accountId,
      );
      const balanceRaw = balanceItem
        ? Number(formatUnits(BigInt(balanceItem.balance), decimals))
        : 0;
      const delegatedPower = combinedPowerFormatted - balanceRaw;

      const percentage = Number(delegate.variation.percentageChange);
      return {
        address: delegate.accountId,
        votingPower:
          delegatedPower > 0 ? formatNumberUserReadable(delegatedPower) : "-",
        balance:
          balanceItem && Number(balanceRaw) > 0
            ? formatNumberUserReadable(balanceRaw)
            : "-",
        total: formatNumberUserReadable(combinedPowerFormatted),
        variation: {
          percentageChange:
            delegate.variation.percentageChange === PERCENTAGE_NO_BASELINE
              ? 9999
              : Number(
                  percentage > 0 && percentage < 1
                    ? "0.01"
                    : percentage.toFixed(2),
                ),
          absoluteChange: Number(
            formatUnits(BigInt(delegate.variation.absoluteChange), decimals),
          ),
        },
        delegators: delegate.delegationsCount,
      };
    });
  }, [data, decimals, balancesData]);

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
          <div className="group flex w-full items-center">
            <EnsAvatar
              address={address as Address}
              size="sm"
              variant="rounded"
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
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
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "balance",
      cell: ({ row }) => {
        const balance = row.getValue("balance") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse w-full items-center justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
            {balance}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("balance")}
        >
          <h4 className="text-table-header whitespace-nowrap">Balance</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "balance"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "votingPower",
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse w-full items-center justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
            {votingPower}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("votingPower")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Delegation received
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "votingPower"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "total",
      cell: ({ row }) => {
        const total = row.getValue("total") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse w-full items-center justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
            {total}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("total")}
        >
          <h4 className="text-table-header whitespace-nowrap">Total</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "total"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-auto",
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
          <div className="flex w-full items-center justify-center gap-2 text-sm">
            {(variation?.percentageChange || 0) < 0 ? "-" : ""}
            {formatNumberUserReadable(Math.abs(variation?.absoluteChange || 0))}
            <Percentage value={variation?.percentageChange || 0} />
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-center p-0"
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
        columnClassName: "w-64",
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
        columnClassName: "w-28",
      },
    },
  ];

  return (
    <>
      <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col">
        <Table
          columns={delegateColumns}
          data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
          onRowClick={(row) => setDrawerAddress(row.address as Address)}
          size="sm"
          hasMore={pagination.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          withDownloadCSV={true}
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
        withVotes={false}
      />
    </>
  );
}
