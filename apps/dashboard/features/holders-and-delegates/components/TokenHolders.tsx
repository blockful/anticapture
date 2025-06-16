"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { formatNumberUserReadable, formatVariation } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address } from "viem";

interface TokenHolders {
  address: string | Address;
  type: "Contract" | "EOA";
  balance: number;
  variation: number;
  delegate: string | Address;
}

export const TokenHolders = () => {
  const tokenHoldersColumns: ColumnDef<TokenHolders>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Address
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Type
        </div>
      ),
    },
    {
      accessorKey: "balance",
      header: () => (
        <div className="text-table-header flex w-full justify-end px-2 py-1.5">
          Balance
        </div>
      ),
      cell: ({ row }) => {
        const balance: number = row.getValue("balance");
        return (
          <div className="font-nomal flex w-full justify-end px-2 py-1.5 text-sm">
            {formatNumberUserReadable(balance)} ENS
          </div>
        );
      },
    },
    {
      accessorKey: "variation",
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Variation
        </div>
      ),
      cell: ({ row }: any) => formatVariation(row.original.variation) + " ENS",
    },
    {
      accessorKey: "delegate",
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Delegate
        </div>
      ),
    },
  ];

  const data: TokenHolders[] = [
    {
      address: "magicbear.eth",
      type: "Contract",
      balance: 3000,
      variation: 300,
      delegate: "0x9d2c...e34b",
    },
    {
      address: "0x2cbe...bbf8",
      type: "EOA",
      balance: 3000,
      variation: 300,
      delegate: "0x9d2c...e34b",
    },
    {
      address: "zeugh.eth",
      type: "EOA",
      balance: 3000,
      variation: 300,
      delegate: "0x9d2c...e34b",
    },
    {
      address: "0x4c1d...9b7f",
      type: "EOA",
      balance: 3000,
      variation: 300,
      delegate: "0x9d2c...e34b",
    },
    {
      address: "isadora.eth",
      type: "Contract",
      balance: 3000,
      variation: 300,
      delegate: "0x9d2c...e34b",
    },
  ];

  return (
    <div className="flex">
      <div className="w-full text-white">
        <TheTable columns={tokenHoldersColumns} data={data} />
      </div>
    </div>
  );
};
