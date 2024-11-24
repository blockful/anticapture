"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { Button } from "./button";
import { ArrowUpDown } from "lucide-react";
import { sanitizeNumber } from "@/lib/utils";

const IsDelegated = {
  Yes: "Yes",
  No: "No",
} as const;

export type IsDelegated = (typeof IsDelegated)[keyof typeof IsDelegated];

export type Holders = {
  address: `0x${string}`;
  amount: number;
  delegated: IsDelegated;
  lastBuy: Date;
};

export const holdersColumns: ColumnDef<Holders>[] = [
  {
    accessorKey: "address",
    cell: ({ row }) => {
      const address: `0x${string}` = row.getValue("address");
      return (
        <>
          {address.slice(0, 6)}...
          {address.slice(address.length - 4, address.length)}
        </>
      );
    },
    header: "Address",
  },
  {
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount: number = row.getValue("amount");

      const totalAmount = 230000000;
      const amountInPercentage = ((amount / totalAmount) * 100).toFixed(2);

      return (
        <div className="text-center flex justify-center items-center ml-5 space-x-1">
          <p className="w-12 truncate flex justify-end text-right">
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center">
          {row.getValue("delegated")}
        </div>
      );
    },
  },
  {
    accessorKey: "lastBuy",
    cell: ({ row }) => {
      const lastBuyDate: Date = row.getValue("lastBuy");

      return <>{lastBuyDate.toLocaleString("en-US")}</>;
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Buy
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];

export const HoldersTable = () => {
  const data: Holders[] = [
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 120000000,
      lastBuy: new Date(180000000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 20000000,
      lastBuy: new Date(180000000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180050000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000300000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180200000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000050000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180500000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000001000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180000000900),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000500000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(185000000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000000600),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180000600000),
      delegated: IsDelegated.No,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180007000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180000000800),
      delegated: IsDelegated.No,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180000000000),
      delegated: IsDelegated.No,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      lastBuy: new Date(180600000000),
      delegated: IsDelegated.Yes,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      lastBuy: new Date(180040000000),
      delegated: IsDelegated.Yes,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <DataTable
        withPagination={true}
        withSorting={true}
        filterColumn="address"
        columns={holdersColumns}
        data={data}
      />
    </div>
  );
};
