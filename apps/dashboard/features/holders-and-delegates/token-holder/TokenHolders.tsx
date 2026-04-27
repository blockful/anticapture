"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import type { Address } from "viem";
import { zeroAddress } from "viem";

import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { Button } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { useArkhamData } from "@/shared/hooks/graphql-client/useArkhamData";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import {
  accountBalancesQueryParamsOrderByEnum,
  orderDirectionEnum,
  type AccountBalancesQueryParamsOrderByEnumKey,
  type OrderDirection,
} from "@anticapture/client";
import { parseAsAddress } from "@/shared/utils/parseAsAddress";

interface TokenHolderTableData {
  address: Address;
  balance: number;
  variation: { percentageChange: number; absoluteChange: number } | null;
  delegate: Address;
}

const TypeCell = ({ address }: { address: Address }) => {
  const { isContract, isLoading: isArkhamLoading } = useArkhamData(address);

  if (isArkhamLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse"
        className="h-5 w-16 rounded-full"
      />
    );
  }

  return (
    <BadgeStatus variant="secondary">
      {isContract ? "Contract" : "EOA"}
    </BadgeStatus>
  );
};

export const TokenHolders = ({
  days,
  daoId,
  showTokenName = true,
}: {
  days: TimeInterval;
  daoId: DaoIdEnum;
  showTokenName?: boolean;
}) => {
  const [drawerAddress, setDrawerAddress] = useQueryState(
    "drawerAddress",
    parseAsAddress,
  );
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("address");
  const [orderDirection, setOrderDirection] = useQueryState(
    "sort",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault("desc"),
  );
  const [orderBy, setOrderBy] = useQueryState(
    "sortBy",
    parseAsStringEnum<AccountBalancesQueryParamsOrderByEnumKey>(
      Object.values(accountBalancesQueryParamsOrderByEnum),
    ).withDefault("balance"),
  );

  const { isMobile } = useScreenSize();

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || null);
  };

  const handleSort = (field: AccountBalancesQueryParamsOrderByEnumKey) => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(field);
      setOrderDirection("desc");
    }
  };

  // Cycles: no-arrow (balance desc) → down-arrow (signed variation desc) → up-arrow (signed variation asc) → both-arrows (variation desc) → no-arrow
  const handleVariationSort = () => {
    if (orderBy === "signedVariation" && orderDirection === "desc") {
      setOrderDirection("asc");
    } else if (orderBy === "signedVariation" && orderDirection === "asc") {
      setOrderBy("variation");
      setOrderDirection("desc");
    } else if (orderBy === "variation") {
      setOrderBy("balance");
      setOrderDirection("desc");
    } else {
      setOrderBy("signedVariation");
      setOrderDirection("desc");
    }
  };

  const {
    data: tableData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useTokenHolders(daoId, {
    limit: 20,
    orderBy,
    orderDirection,
    addresses: currentAddressFilter ? [currentAddressFilter] : undefined,
    fromDay: days,
  });

  const tokenHoldersColumns: ColumnDef<TokenHolderTableData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter || undefined}
          />
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <div className="flex w-full items-center gap-3">
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

        const addressValue: string = row.getValue("address");

        return (
          <div className="group flex w-full items-center">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
            {!isMobile && (
              <div className="flex items-center opacity-0 transition-opacity [tr:hover_&]:opacity-100">
                <CopyAndPasteButton
                  textToCopy={addressValue as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="mx-1 p-1"
                  iconSize="md"
                />
                <Button
                  data-ph-event="holder_details"
                  data-ph-source="holders_table"
                  data-umami-event="holder_details"
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
      meta: {
        columnClassName: "w-68",
      },
    },
    {
      accessorKey: "type",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          <span>Type</span>
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-5 w-16 rounded-full"
            />
          );
        }
        return <TypeCell address={row.original.address} />;
      },
      meta: {
        columnClassName: "w-12",
      },
    },
    {
      accessorKey: "balance",
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("balance")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Balance {!!showTokenName && `(${daoId})`}
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              orderBy === "balance"
                ? orderDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <div className="flex w-full items-center justify-end">
              <SkeletonRow className="h-4 w-20" />
            </div>
          );
        }

        const balance: number = row.getValue("balance");
        return (
          <div className="flex w-full items-center justify-end text-sm font-normal">
            {formatNumberUserReadable(balance, 1)}
          </div>
        );
      },
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "variation",
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
              orderBy === "signedVariation"
                ? orderDirection === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.UP
                : orderBy === "variation"
                  ? ArrowState.BOTH
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      cell: ({ row }) => {
        const variation = row.getValue("variation") as
          | {
              percentageChange: number;
              absoluteChange: number;
            }
          | undefined;

        if (isLoading) {
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
          <div className="grid w-full grid-cols-2 items-center gap-2 overflow-hidden text-sm">
            <span className="min-w-0 text-right tabular-nums">
              {(variation?.percentageChange || 0) < 0 ? "-" : ""}
              {formatNumberUserReadable(
                Math.abs(variation?.absoluteChange || 0),
              )}
            </span>
            <Percentage
              className="min-w-0"
              value={variation?.percentageChange || 0}
            />
          </div>
        );
      },
      meta: {
        columnClassName: "w-50",
      },
    },
    {
      accessorKey: "delegate",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Delegate
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <div className="flex items-center gap-1.5">
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

        const delegate: string = row.getValue("delegate");

        return (
          <div className="flex items-center gap-1.5">
            {delegate === zeroAddress ? (
              <div className="flex items-center">
                <BadgeStatus variant={"error"}>{"Not delegated"}</BadgeStatus>
              </div>
            ) : (
              <EnsAvatar
                address={delegate as Address}
                size="sm"
                variant="rounded"
              />
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-40",
      },
    },
  ];

  return (
    <>
      <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col text-white">
        <Table
          columns={tokenHoldersColumns}
          data={tableData ?? Array(DEFAULT_ITEMS_PER_PAGE).fill({})}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onRowClick={(row) => setDrawerAddress(row.address)}
          size="sm"
          withDownloadCSV={true}
          csvFilename="token-holders.csv"
          // error={error}
          fillHeight
        />
      </div>
      <HoldersAndDelegatesDrawer
        isOpen={!!drawerAddress}
        onClose={() => setDrawerAddress(null)}
        entityType="tokenHolder"
        address={drawerAddress || ""}
        daoId={daoId}
      />
    </>
  );
};
