"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, formatUnits, zeroAddress } from "viem";
import { Plus } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useHistoricalBalances } from "@/shared/hooks/graphql-client/useHistoricalBalances";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { useScreenSize } from "@/shared/hooks";
import { AddressFilter } from "@/shared/components/design-system/filters/AddressFilter";
import { Table } from "@/shared/components/design-system/table/Table";
import { Button } from "@/shared/components";

interface TokenHolderTableData {
  address: Address;
  type: string | undefined;
  balance: number;
  variation: { percentageChange: number; absoluteChange: number } | null;
  delegate: Address;
}

export const TokenHolders = ({
  days,
  daoId,
}: {
  days: TimeInterval;
  daoId: DaoIdEnum;
}) => {
  const [selectedTokenHolder, setSelectedTokenHolder] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentAddressFilter, setCurrentAddressFilter] = useState<string>("");
  const pageLimit: number = 10;
  const { isMobile } = useScreenSize();

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

  const {
    data: tokenHoldersData,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchingMore,
  } = useTokenHolders({
    daoId: daoId,
    limit: pageLimit,
    orderDirection: sortOrder,
    address: currentAddressFilter,
  });

  const [historicalBalancesCache, setHistoricalBalancesCache] = useState<
    Map<string, string>
  >(new Map());

  const newAddressesToFetch = useMemo(
    () =>
      tokenHoldersData
        ?.map((h) => h.accountId.toLowerCase())
        .filter((addr) => !historicalBalancesCache.has(addr)) || [],
    [tokenHoldersData, historicalBalancesCache],
  );

  const { data: newHistoricalBalances } = useHistoricalBalances(
    daoId,
    newAddressesToFetch,
    days,
  );

  useEffect(() => {
    if (newHistoricalBalances && newHistoricalBalances.length > 0) {
      setHistoricalBalancesCache((prevCache) => {
        const newCache = new Map(prevCache);
        newHistoricalBalances.forEach((h) => {
          if (h) {
            newCache.set(h.address.toLowerCase(), h.balance);
          }
        });
        return newCache;
      });
    }
  }, [newHistoricalBalances]);

  useEffect(() => {
    setHistoricalBalancesCache(new Map());
  }, [sortOrder, currentAddressFilter, days]);

  const handleOpenDrawer = (address: string) => {
    setSelectedTokenHolder(address);
  };

  const handleCloseDrawer = () => {
    setSelectedTokenHolder("");
  };

  const calculateVariation = (
    currentBalance: string,
    historicalBalance: string | undefined,
  ): { percentageChange: number; absoluteChange: number } | null => {
    if (!historicalBalance) return null;

    try {
      const current = Number(formatUnits(BigInt(currentBalance), 18));
      const historical = Number(formatUnits(BigInt(historicalBalance), 18));

      if (historical === 0) return { percentageChange: 0, absoluteChange: 0 };

      // Calculate absolute change in tokens
      const absoluteChange = current - historical;
      // Calculate percentage variation
      const percentageChange = ((current - historical) / historical) * 100;

      return {
        percentageChange: Number(percentageChange.toFixed(2)),
        absoluteChange: Number(absoluteChange.toFixed(2)),
      };
    } catch (error) {
      console.error("Error calculating variation:", error);
      return { percentageChange: 0, absoluteChange: 0 };
    }
  };

  const tableData: TokenHolderTableData[] = useMemo(
    () =>
      tokenHoldersData?.map((holder) => {
        const historicalBalance = historicalBalancesCache.get(
          holder.accountId.toLowerCase(),
        );

        const variation = calculateVariation(holder.balance, historicalBalance);

        return {
          address: holder.accountId as Address,
          type: holder.account?.type,
          balance: Number(formatUnits(BigInt(holder.balance), 18)),
          variation,
          delegate: holder.delegate as Address,
        };
      }) || [],
    [tokenHoldersData, historicalBalancesCache],
  );

  const tokenHoldersColumns: ColumnDef<TokenHolderTableData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter}
            className="ml-2"
          />
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
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
          <div className="group flex w-full items-center gap-2">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="opacity-0 transition-opacity [tr:hover_&]:opacity-100"
              >
                <Plus className="size-3.5" />
                <span className="text-sm font-medium">Details</span>
              </Button>
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };

        return (
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Balance ({daoId})
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary justify-end p-0"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{
                  className: "size-4",
                }}
                activeState={
                  sortOrder === "asc"
                    ? ArrowState.UP
                    : sortOrder === "desc"
                      ? ArrowState.DOWN
                      : ArrowState.DEFAULT
                }
              />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (loading) {
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
        columnClassName: "w-48",
      },
    },
    {
      accessorKey: "variation",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Variation ({daoId})
        </div>
      ),
      cell: ({ row }) => {
        const variation = row.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        } | null;

        if (variation === null) {
          return (
            <div className="flex w-full items-center justify-start">
              <SkeletonRow
                className="h-4 w-16"
                parentClassName="flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full items-center justify-start gap-2 px-4 text-sm">
            {formatNumberUserReadable(Math.abs(variation.absoluteChange))}
            <Percentage value={variation.percentageChange} />
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
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
        if (loading) {
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
            <EnsAvatar
              address={delegate as Address}
              size="sm"
              variant="rounded"
            />
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
      },
    },
  ];

  if (loading) {
    return (
      <div className="w-full text-white">
        <div className="flex flex-col gap-2">
          <Table
            size="sm"
            columns={tokenHoldersColumns}
            data={
              Array.from({ length: 10 }, () => ({
                address: zeroAddress,
                type: "EOA" as string | undefined,
                balance: 0,
                variation: { percentageChange: 0, absoluteChange: 0 },
                delegate: zeroAddress,
              })) as TokenHolderTableData[]
            }
            withSorting={true}
            withDownloadCSV={true}
            onRowClick={() => {}}
            className="h-[400px]"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-white">
        <div className="flex flex-col gap-2">
          <div className="md:border-light-dark relative w-full overflow-auto md:rounded-lg md:border">
            <table className="bg-surface-background text-secondary md:bg-surface-default w-full table-auto caption-bottom text-sm md:table-fixed">
              <thead className="text-secondary sm:bg-surface-contrast text-xs font-semibold sm:font-medium [&_th:first-child]:border-r [&_th:first-child]:border-white/10 md:[&_th]:border-none [&_tr]:border-b">
                <tr className="border-light-dark">
                  {tokenHoldersColumns.map((column, index) => (
                    <th
                      key={index}
                      className="text-left [&:has([role=checkbox])]:pr-0"
                      style={{
                        width: column.size !== 150 ? column.size : "auto",
                      }}
                    >
                      {typeof column.header === "function"
                        ? column.header({
                            column: {
                              getIsSorted: () => false,
                              toggleSorting: () => {},
                            },
                          } as Parameters<typeof column.header>[0])
                        : column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="scrollbar-none [&_tr:last-child]:border-0">
                <tr className="hover:bg-surface-contrast transition-colors duration-300">
                  <td
                    colSpan={tokenHoldersColumns.length}
                    className="bg-light h-[410px] p-0 text-center"
                  >
                    <div className="flex h-full items-center justify-center">
                      <div className="text-error">
                        {/* Error loading token holders: {error.message} */}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full text-white">
        <div className="flex flex-col gap-2">
          <Table
            columns={tokenHoldersColumns}
            data={tableData}
            hasMore={pagination.hasNextPage}
            isLoadingMore={fetchingMore}
            onLoadMore={fetchNextPage}
            onRowClick={(row) => handleOpenDrawer(row.address as Address)}
            size="sm"
            withDownloadCSV={true}
            withSorting={true}
            wrapperClassName="h-[475px]"
            className="h-[400px]"
          />
        </div>
      </div>
      <HoldersAndDelegatesDrawer
        isOpen={!!selectedTokenHolder}
        onClose={handleCloseDrawer}
        entityType="tokenHolder"
        address={selectedTokenHolder || ""}
        daoId={daoId}
      />
    </>
  );
};
