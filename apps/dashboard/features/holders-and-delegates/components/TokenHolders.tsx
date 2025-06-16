"use client";

import { TheTable } from "@/shared/components/tables/TheTable";
import { formatNumberUserReadable, formatVariation } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, isAddress } from "viem";
import { tokenHoldersMock } from "@/features/holders-and-delegates/mock-data/TokenHoldersMock";
import { formatAddress } from "@/shared/utils/formatAddress";
import { Badge } from "@/shared/components/badges/Badge";

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
      cell: ({ row }) => {
        const addressValue: string = row.getValue("address");
        const address = isAddress(addressValue)
          ? formatAddress(addressValue)
          : "Invalid address";

        return (
          <div className="flex w-full items-start justify-start px-2 py-1.5 text-sm">
            {address}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Type
        </div>
      ),
      cell: ({ row }) => {
        const typeValue: string = row.getValue("type");
        const type = typeValue === "Contract" ? "Contract" : "EOA";
        return (
          <div className="flex w-full items-start justify-start px-2 py-1.5 text-sm">
            <Badge>{type}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "balance",
      header: () => (
        <div className="text-table-header flex w-full px-2 py-1.5 sm:justify-end">
          Balance
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
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-2 py-1.5">
          Variation
        </div>
      ),
      cell: ({ row }) => {
        const variation: number = row.getValue("variation");
        return (
          <div className="flex w-full items-start justify-start px-2 py-1.5 text-sm">
            {variation}%
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
          <div className="flex w-full items-start justify-start px-2 py-1.5 text-sm">
            {delegateAddress}
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

  return (
    <div className="flex">
      <div className="w-full text-white">
        <TheTable columns={tokenHoldersColumns} data={data} />
      </div>
    </div>
  );
};
