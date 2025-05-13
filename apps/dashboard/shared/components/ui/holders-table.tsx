"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/ui/data-table";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { bulkGetEnsName, User } from "@/lib/server/utils";
import { RED_COLOR, GREEN_COLOR, sanitizeNumber } from "@/lib/client/utils";
import {
  Holders,
  holdersData,
  IsDelegated,
} from "@/lib/mocked-data/mocked-data";
import { HandIcon } from "@/shared/components/icons";

export const holdersColumns: ColumnDef<Holders>[] = [
  {
    accessorKey: "user",
    cell: ({ row }) => {
      const user: User = row.getValue("user");

      const ensName = user.ensName;
      const walletAddress = user.walletAddress;

      const etherscanAddressURL = `https://etherscan.io/address/${user.walletAddress}`;
      const ensDomainsAccountURL = `https://app.ens.domains/${ensName}`;

      return (
        <p className="scrollbar-none flex max-w-40 items-center space-x-1 overflow-auto text-white">
          {ensName ? (
            <>
              <a className="hover:underline" href={ensDomainsAccountURL}>
                {ensName}
              </a>
              <p>|</p>
            </>
          ) : null}
          <a className="hover:underline" href={etherscanAddressURL}>
            {walletAddress}
          </a>
        </p>
      );
    },
    header: "Holder",
  },
  {
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount: number = row.getValue("amount");

      const totalAmount = 230000000;
      const amountInPercentage = ((amount / totalAmount) * 100).toFixed(2);

      return (
        <div className="ml-5 flex items-center justify-center space-x-1 text-center">
          <p className="flex w-12 justify-end truncate text-right">
            {sanitizeNumber(amount)}
          </p>
          <p>|</p>
          <p className="w-16 truncate text-left">{amountInPercentage}%</p>
        </div>
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount | %
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "delegated",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delegated
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div
          className="flex items-center justify-center"
          style={{
            color:
              row.getValue("delegated") === IsDelegated.No
                ? RED_COLOR
                : GREEN_COLOR,
          }}
        >
          {row.getValue("delegated")}
        </div>
      );
    },
  },
  {
    accessorKey: "lastBuy",
    cell: ({ row }) => {
      const lastBuyDate: Date = row.getValue("lastBuy");

      return (
        <p className="mx-auto text-center">
          {lastBuyDate.toLocaleString("en-US").split(",")[0]}
        </p>
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Buy
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
];

export const HoldersTable = () => {
  const [data, setData] = useState<Holders[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    bulkGetEnsName(holdersData.map((holder) => holder.user.walletAddress))
      .then((ensNames) => {
        const data = holdersData.map((holder, idx) => {
          return {
            ...holder,
            user: {
              ...holder.user,
              ensName: ensNames[idx] || null,
            },
          };
        });

        setData(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DataTable
      title="Holders"
      icon={<HandIcon />}
      isLoading={isLoading}
      withSorting={true}
      withPagination={true}
      filterColumn={"ensNameAndAddress"}
      columns={holdersColumns}
      data={data}
    />
  );
};
