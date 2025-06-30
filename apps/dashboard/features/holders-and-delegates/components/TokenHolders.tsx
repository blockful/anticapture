"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import { CheckIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useRouter } from "next/navigation";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
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
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Address
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
          return (
            <div className="flex h-10 items-center gap-2 px-4 py-2">
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
          <div className="group flex h-10 w-full items-center gap-2 px-4 py-2">
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
      enableColumnFilter: true,
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const rowValue = row.getValue(id) as string;
        return filterValue.includes(rowValue);
      },
      header: ({ column }) => {
        const options = ["Remove All", "Contract", "EOA"];

        const handleOptionClick = (option: string) => {
          if (option === "Remove All") {
            setSelectedFilters([]);
            column.setFilterValue(undefined);
            return;
          }

          setSelectedFilters((prev) => {
            const newFilters = prev.includes(option)
              ? prev.filter((filter) => filter !== option)
              : [...prev, option];

            // Atualiza o filtro da coluna
            column.setFilterValue(
              newFilters.length > 0 ? newFilters : undefined,
            );

            return newFilters;
          });
        };

        return (
          <div className="text-table-header relative flex h-8 w-full items-center justify-start gap-1.5 px-2">
            <div className="flex items-center gap-1.5">
              <p>Type</p>
              <ButtonFilter
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                isActive={isFilterOpen}
              />
            </div>
            {isFilterOpen && (
              <div className="bg-surface-contrast absolute top-0 left-0 z-50 mt-10 min-w-[100px] rounded-md border border-[#3F3F46] py-1">
                {options.map((option) => {
                  const isSelected =
                    option === "Remove All"
                      ? selectedFilters.length === 0
                      : selectedFilters.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        handleOptionClick(option);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "hover:bg-surface-hover flex w-full items-center justify-between px-3 py-2 text-left",
                        option === "Remove All" && "border-b border-[#3F3F46]",
                        isSelected &&
                          option !== "Remove All" &&
                          "bg-middle-dark",
                      )}
                    >
                      <span className="text-primary text-sm font-normal">
                        {option}
                      </span>
                      {isSelected && option !== "Remove All" && (
                        <CheckIcon className="size-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      },
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

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full text-white">
        <TheTable
          columns={tokenHoldersColumns}
          data={tableData}
          filterColumn="type"
          withSorting={true}
          onRowClick={() => {}}
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
