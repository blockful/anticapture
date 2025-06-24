"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useRouter } from "next/navigation";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import { useTokenHolder } from "@/shared/hooks/graphql-client/useTokenHolder";
import { formatUnits } from "viem";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useHistoricalBalances } from "@/shared/hooks/graphql-client/useHistoricalBalances";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

interface TokenHolders {
  address: string | Address;
  type: "Contract" | "EOA";
  balance: number;
  variation: {
    percentageChange: number;
    absoluteChange: number;
  };
  delegate: string | Address;
}

export const TokenHolders = ({
  days,
  daoId,
}: {
  days: TimeInterval;
  daoId: DaoIdEnum;
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const router = useRouter();
  const {
    data: tokenHoldersData,
    loading,
    pageInfo,
    fetchMore,
  } = useTokenHolder(daoId);
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

  const data: TokenHolders[] =
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
        type: holder.account.type as "Contract" | "EOA",
        balance: Number(formatUnits(BigInt(holder.balance), 18)),
        variation,
        delegate: holder.delegate as Address,
      };
    }) || [];

  const tokenHoldersColumns: ColumnDef<TokenHolders>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Address
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex h-10 items-center gap-2">
              <SkeletonRow className="size-6 rounded-full" />
              <SkeletonRow className="h-4 w-24" />
            </div>
          );
        }

        const addressValue: string = row.getValue("address");
        const address = isAddress(addressValue)
          ? formatAddress(addressValue)
          : "Invalid address";

        return (
          <div className="group relative flex h-10 w-full items-center gap-2">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
            />
            <span className="text-primary [tr:hover_&]:border-primary w-fit border-b border-dashed border-transparent text-sm">
              {address}
            </span>
            <button
              className="border-surface-contrast bg-surface-default text-primary hover:bg-surface-hover absolute right-0 flex items-center gap-1.5 rounded-md border px-2 py-1 opacity-0 transition-opacity [tr:hover_&]:opacity-100"
              tabIndex={-1}
              onClick={(e) => handleDetailsClick(addressValue as Address, e)}
            >
              <PlusIcon className="size-3.5" />
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
        if (!isMounted || loading) {
          return <SkeletonRow className="h-5 w-16" />;
        }

        const typeValue: string = row.getValue("type");
        const type = typeValue === "Contract" ? "Contract" : "EOA";
        return (
          <div className="flex h-10 w-full items-center justify-start px-2 text-sm">
            <BadgeStatus variant="dimmed">{type}</BadgeStatus>
          </div>
        );
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <div className="text-table-header flex h-8 w-full items-center justify-end px-2">
          Balance
          <button
            className="!text-table-header cursor-pointer justify-end text-end"
            onClick={() => column.toggleSorting()}
          >
            <ArrowUpDown
              props={{
                className: "ml-2 size-4",
              }}
              activeState={
                column.getIsSorted() === "asc"
                  ? ArrowState.UP
                  : column.getIsSorted() === "desc"
                    ? ArrowState.DOWN
                    : ArrowState.DEFAULT
              }
            />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return <SkeletonRow className="h-4 w-20" />;
        }

        const balance: number = row.getValue("balance");
        return (
          <div className="font-nomal flex h-10 w-full items-center justify-end px-2 text-sm">
            {formatNumberUserReadable(balance, 1)} {daoId}
          </div>
        );
      },
    },
    {
      accessorKey: "variation",
      header: ({ column }) => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Variation
          <button
            className="!text-table-header cursor-pointer justify-end text-end"
            onClick={() => column.toggleSorting()}
          >
            <ArrowUpDown
              props={{
                className: "ml-2 size-4",
              }}
              activeState={
                column.getIsSorted() === "asc"
                  ? ArrowState.UP
                  : column.getIsSorted() === "desc"
                    ? ArrowState.DOWN
                    : ArrowState.DEFAULT
              }
            />
          </button>
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return <SkeletonRow className="h-4 w-16" />;
        }

        const variation = row.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };

        return (
          <div className="flex h-10 w-full items-center justify-start gap-2 px-2 text-sm">
            <p>
              {formatNumberUserReadable(Math.abs(variation.absoluteChange))}{" "}
              {daoId}
            </p>
            <div>
              <Percentage value={variation.percentageChange} />
            </div>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const variationA = rowA.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };
        const variationB = rowB.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };

        return variationA.percentageChange - variationB.percentageChange;
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
        if (!isMounted || loading) {
          return (
            <div className="flex h-10 items-center gap-1.5">
              <SkeletonRow className="h-6 w-6 rounded-full" />
              <SkeletonRow className="h-4 w-24" />
            </div>
          );
        }

        const delegate: string = row.getValue("delegate");
        const delegateAddress = isAddress(delegate)
          ? formatAddress(delegate)
          : "Invalid address";

        return (
          <div className="flex h-10 items-center gap-1.5">
            <EnsAvatar
              address={delegate as Address}
              size="sm"
              variant="rounded"
            />
            <span className="text-primary text-sm">{delegateAddress}</span>
          </div>
        );
      },
    },
  ];

  const handleRowClick = (row: TokenHolders) => {
    router.push(`/${row.address}`);
  };

  const handleDetailsClick = (address: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Details button clicked for address:", address);
    router.push(`/${address}`);
  };

  const handlePageChange = (page: number) => {
    if (page > currentPage && pageInfo?.hasNextPage) {
      fetchMore(pageInfo.endCursor!, "forward");
      setCurrentPage(page);
    } else if (page < currentPage && pageInfo?.hasPreviousPage) {
      fetchMore(pageInfo.startCursor!, "backward");
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full text-white">
        <TheTable
          columns={tokenHoldersColumns}
          data={loading ? Array(5).fill({}) : data || []}
          filterColumn="type"
          withSorting={true}
          onRowClick={handleRowClick}
        />
      </div>
      <div>
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={handlePageChange}
          className="text-white"
          hasNextPage={!!pageInfo?.hasNextPage}
          hasPreviousPage={!!pageInfo?.hasPreviousPage}
        />
      </div>
    </div>
  );
};
