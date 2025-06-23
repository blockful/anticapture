"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { tokenHoldersMock } from "@/features/holders-and-delegates/mock-data/TokenHoldersMock";
import { formatAddress } from "@/shared/utils/formatAddress";
import { CheckIcon, Filter, PlusIcon } from "lucide-react";
import { useState } from "react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useRouter } from "next/navigation";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";

interface TokenHolders {
  address: string | Address;
  type: "Contract" | "EOA";
  balance: number;
  variation: number;
  delegate: string | Address;
}

export const TokenHolders = () => {
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const router = useRouter();
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
      header: ({ column }) => {
        const filterValue = column.getFilterValue();
        const options = ["Remove All", "Contract", "EOA"];

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
              <div className="absolute top-0 left-0 z-50 mt-10 min-w-[100px] rounded-md border border-white/10 bg-[#1C1C1F] py-1">
                {options.map((option) => {
                  const value = option === "Remove All" ? undefined : option;
                  const isSelected = filterValue === value;

                  return (
                    <button
                      key={option}
                      onClick={() => {
                        column.setFilterValue(value);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "text-primary flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#26262A]",
                        isSelected && "bg-middle-dark",
                      )}
                    >
                      <span>{option}</span>
                      {isSelected && <CheckIcon className="size-3.5" />}
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
            {formatNumberUserReadable(balance, 1)} ENS
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
        const variation: number = row.getValue("variation");
        return (
          <div className="flex w-full items-start justify-start gap-2 px-2 py-1.5 text-sm">
            <p>{variation}%</p>
            <div>
              <Percentage value={variation} />
            </div>
          </div>
        );
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

  const data: TokenHolders[] = [
    {
      address: tokenHoldersMock[0].accountId,
      type: tokenHoldersMock[0].account.type,
      balance: tokenHoldersMock[0].balance,
      variation: 300,
      delegate: tokenHoldersMock[0].delegate,
    },
    {
      address: tokenHoldersMock[1].accountId,
      type: tokenHoldersMock[1].account.type,
      balance: tokenHoldersMock[1].balance,
      variation: 300,
      delegate: tokenHoldersMock[1].delegate,
    },
    {
      address: tokenHoldersMock[2].accountId,
      type: tokenHoldersMock[2].account.type,
      balance: tokenHoldersMock[2].balance,
      variation: 300,
      delegate: tokenHoldersMock[2].delegate,
    },
    {
      address: tokenHoldersMock[3].accountId,
      type: tokenHoldersMock[3].account.type,
      balance: tokenHoldersMock[3].balance,
      variation: 300,
      delegate: tokenHoldersMock[3].delegate,
    },
    {
      address: tokenHoldersMock[4].accountId,
      type: tokenHoldersMock[4].account.type,
      balance: tokenHoldersMock[4].balance,
      variation: 300,
      delegate: tokenHoldersMock[4].delegate,
    },
  ];

  interface TokenHolder {
    address: string | Address;
  }

  const handleRowClick = (row: TokenHolder) => {
    setIsDetailsOpen(true);
    row.address && router.push(`/${row.address}`);
  };

  return (
    <div className="flex">
      <div className="w-full text-white">
        <TheTable
          columns={tokenHoldersColumns}
          data={data}
          filterColumn="type"
          withSorting={true}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};
