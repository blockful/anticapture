"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useRouter } from "next/navigation";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { formatUnits } from "viem";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useHistoricalBalances } from "@/shared/hooks/graphql-client/useHistoricalBalances";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

export const TokenHolders = ({
  days,
  daoId,
}: {
  days: TimeInterval;
  daoId: DaoIdEnum;
}) => {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const router = useRouter();
  const pageLimit: number = 10;

  const {
    data: tokenHoldersData,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore,
  } = useTokenHolders({
    daoId: daoId,
    limit: pageLimit,
    orderDirection: sortOrder,
  });

  const addresses = tokenHoldersData?.map((holder) => holder.accountId);
  const { data: historicalBalancesData } = useHistoricalBalances(
    daoId,
    addresses || [],
    days,
  );

  const calculateVariation = (
    currentBalance: string,
    historicalBalance: string | undefined,
  ): { percentageChange: number; absoluteChange: number } => {
    if (!currentBalance || !historicalBalance)
      return { percentageChange: 0, absoluteChange: 0 };

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

  const data =
    tokenHoldersData?.map((holder) => {
      const historicalBalance = historicalBalancesData?.find(
        (h) => h.address.toLowerCase() === holder.accountId.toLowerCase(),
      );

      const variation = calculateVariation(
        holder.balance,
        historicalBalance?.balance,
      );

      return {
        address: holder.accountId as Address,
        type: holder.account?.type,
        balance: Number(formatUnits(BigInt(holder.balance), 18)),
        variation,
        delegate: holder.delegate as Address,
      };
    }) || [];

  // Create skeleton data when loading
  const skeletonData = Array(10).fill({
    address: "0x0000000000000000000000000000000000000000" as Address,
    type: "EOA",
    balance: 0,
    variation: { percentageChange: 0, absoluteChange: 0 },
    delegate: "0x0000000000000000000000000000000000000000" as Address,
  });

  const tableData = loading ? skeletonData : data;

  const tokenHoldersColumns: ColumnDef<typeof data>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start pl-4">
          Address
        </div>
      ),
      size: 280,
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-2 py-2">
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
        const address = isAddress(addressValue)
          ? formatAddress(addressValue)
          : "Invalid address";

        return (
          <div className="group flex h-10 w-full items-center gap-2 px-2 py-2">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
            />
            <button
              className="bg-surface-default text-primary hover:bg-surface-contrast flex cursor-pointer items-center gap-1.5 rounded-md border border-[#3F3F46] px-2 py-1 opacity-0 transition-opacity [tr:hover_&]:opacity-100"
              tabIndex={-1}
              onClick={(e) => handleDetailsClick(addressValue as Address, e)}
            >
              <Plus className="size-3.5" />
              <span className="text-sm font-medium">Details</span>
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start pl-4">
          Type
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center px-4 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-5 w-16"
              />
            </div>
          );
        }

        const typeValue: string = row.getValue("type");
        const type = typeValue === "Contract" ? "Contract" : "EOA";
        return (
          <div className="flex h-10 w-full items-center justify-start px-4 py-2 text-sm">
            <BadgeStatus variant="dimmed">{type}</BadgeStatus>
          </div>
        );
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
          <div className="text-table-header flex h-8 w-full items-center justify-end px-2">
            Balance ({daoId})
            <button
              className="!text-table-header cursor-pointer justify-end text-end"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{
                  className: "ml-2 size-4",
                }}
                activeState={
                  sortOrder === "asc"
                    ? ArrowState.UP
                    : sortOrder === "desc"
                      ? ArrowState.DOWN
                      : ArrowState.DEFAULT
                }
              />
            </button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center justify-end px-4 py-2">
              <SkeletonRow className="h-4 w-20" />
            </div>
          );
        }

        const balance: number = row.getValue("balance");
        return (
          <div className="font-nomal flex h-10 w-full items-center justify-end px-4 py-2 text-sm">
            {formatNumberUserReadable(balance, 1)}
          </div>
        );
      },
    },
    {
      accessorKey: "variation",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Variation ({daoId})
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center justify-start px-4 py-2">
              <SkeletonRow
                className="h-4 w-16"
                parentClassName="flex animate-pulse"
              />
            </div>
          );
        }

        const variation = row.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };

        return (
          <div className="flex h-10 w-full items-center justify-start gap-2 px-4 py-2 text-sm">
            <p>
              {formatNumberUserReadable(
                Math.abs(variation.absoluteChange),
              )}{" "}
            </p>
            <div>
              <Percentage value={variation.percentageChange} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "delegate",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Delegate
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center gap-1.5 px-4 py-2">
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
        const delegateAddress = isAddress(delegate)
          ? formatAddress(delegate)
          : "Invalid address";

        return (
          <div className="flex h-10 items-center gap-1.5 px-4 py-2">
            <EnsAvatar
              address={delegate as Address}
              size="sm"
              variant="rounded"
            />
          </div>
        );
      },
    },
  ];

  const handleDetailsClick = (address: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Details button clicked for address:", address);
    router.push(`/${address}`);
  };

  const handlePageChange = async (page: number) => {
    if (page > pagination.currentPage && pagination.hasNextPage) {
      await fetchNextPage();
    } else if (page < pagination.currentPage && pagination.hasPreviousPage) {
      await fetchPreviousPage();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="md:border-light-dark relative w-full overflow-auto md:rounded-lg md:border">
          <table className="bg-surface-background text-secondary md:bg-surface-default w-full table-auto caption-bottom text-sm md:table-fixed">
            <thead className="text-secondary sm:bg-surface-contrast text-xs font-semibold sm:font-medium md:[&_th]:border-none [&_th:first-child]:border-r [&_th:first-child]:border-white/10 [&_tr]:border-b">
              <tr className="border-light-dark">
                {tokenHoldersColumns.map((column, index) => (
                  <th
                    key={index}
                    className="h-8 text-left [&:has([role=checkbox])]:pr-0"
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
                        } as any)
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

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          className="text-white"
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full text-white">
        <TheTable
          columns={tokenHoldersColumns}
          data={tableData}
          withSorting={true}
          onRowClick={() => {}}
          isTableSmall={true}
        />
      </div>
      <div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          className="text-white"
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
        />
      </div>
    </div>
  );
};
