"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
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
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
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
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Address
        </div>
      ),
      cell: ({ row }) => {
        const addressValue: string = row.getValue("address");
        const address = isAddress(addressValue)
          ? formatAddress(addressValue)
          : "Invalid address";

        return (
          <>
            <div className="flex w-full gap-2 py-1.5">
              <div className="flex items-center gap-1.5 px-2">
                <div>
                  <EnsAvatar
                    address={addressValue as Address}
                    size="sm"
                    variant="rounded"
                  />
                </div>

                <div className="text-primary flex w-full items-start justify-start px-2 py-1.5 text-sm">
                  {address}
                </div>
              </div>
              {isDetailsOpen && (
                <button className="border-surface-contrast bg-surface-default text-primary flex items-center gap-1.5 rounded-md border px-2 py-1">
                  <PlusIcon className="size-3.5" />
                  <p className="text-sm font-medium">Details</p>
                </button>
              )}
            </div>
          </>
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
          <div className="text-table-header relative flex w-full items-start justify-start gap-1.5 px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <p>Type</p>
              <ButtonFilter
                onClick={() => setFilterOpen(!filterOpen)}
                isActive={filterOpen}
              />
            </div>
            {filterOpen && (
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
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "text-primary hover:bg-surface-hover flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                        option === "Remove All" && "border-b border-[#3F3F46]",
                        isSelected &&
                          option !== "Remove All" &&
                          "bg-middle-dark",
                      )}
                    >
                      <span>{option}</span>
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
        const typeValue: string = row.getValue("type");
        const type = typeValue === "Contract" ? "Contract" : "EOA";
        return (
          <div className="flex w-full items-start justify-start px-2 py-1.5 text-sm">
            <BadgeStatus variant="dimmed">{type}</BadgeStatus>
          </div>
        );
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <div className="text-table-header flex w-full px-2 py-1.5 sm:justify-end">
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
        const balance: number = row.getValue("balance");
        return (
          <div className="font-nomal flex w-full justify-end px-2 py-1.5 text-sm">
            {formatNumberUserReadable(balance, 1)} {daoId}
          </div>
        );
      },
    },
    {
      accessorKey: "variation",
      header: ({ column }) => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
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
        const variation = row.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };

        return (
          <div className="flex w-full items-start justify-start gap-2 px-2 py-1.5 text-sm">
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
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Delegate
        </div>
      ),
      cell: ({ row }) => {
        const delegate: string = row.getValue("delegate");
        const delegateAddress = isAddress(delegate)
          ? formatAddress(delegate)
          : "Invalid address";

        return (
          <div className="flex items-center gap-1.5 px-2">
            <div>
              <EnsAvatar
                address={delegate as Address}
                size="sm"
                variant="rounded"
              />
            </div>
            <div className="text-primary flex w-full items-start justify-start px-2 py-1.5 text-sm">
              {delegateAddress}
            </div>
          </div>
        );
      },
    },
  ];

  const handleRowClick = (row: TokenHolders) => {
    setIsDetailsOpen(true);
    row.address && router.push(`/${row.address}`);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full text-white">
        <TheTable
          columns={tokenHoldersColumns}
          data={data}
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
