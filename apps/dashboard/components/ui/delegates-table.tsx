"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { Button } from "./button";
import { ArrowUpDown, InfoIcon } from "lucide-react";
import { useState } from "react";
import { sanitizeNumber } from "@/lib/utils";

export type Delegates = {
  address: `0x${string}`;
  amount: number;
  delegators: number;
  voted: number;
};

export const delegatesColumns: ColumnDef<Delegates>[] = [
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
    accessorKey: "delegators",
    cell: ({ row }) => {
      const delegators: number = row.getValue("delegators");
      return <p className="text-center mr-4">{sanitizeNumber(delegators)}</p>;
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delegators
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "voted",
    cell: ({ row }) => {
      const delegators: number = row.getValue("voted");
      return <div className="text-center mr-8">{delegators * 100}%</div>;
    },
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Voted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>

          <VotedProposalsPercentageInfoIcon />
        </div>
      );
    },
  },
];

export const DelegatesTable = () => {
  const data: Delegates[] = [
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 1200000,
      delegators: 2000,
      voted: 0.96,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 200100000,
      delegators: 1000,
      voted: 0.6,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
    {
      address: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      amount: 10000000,
      delegators: 500,
      voted: 0.76,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <DataTable
        withPagination={true}
        withSorting={true}
        filterColumn="address"
        columns={delegatesColumns}
        data={data}
      />
    </div>
  );
};

const VotedProposalsPercentageInfoIcon = () => {
  const [showInfo, setShowInfo] = useState(false);

  const toggle = () => setShowInfo(!showInfo);

  return (
    <div className="relative z-40">
      <div
        className={`w-[220px] text-center bg-black text-white p-3 rounded-md absolute right-0 top-5 ${
          showInfo ? "block" : "hidden"
        }`}
      >
        This is the percentage of proposals voted by this wallet in the last 90
        days.
      </div>
      <InfoIcon
        className="ml-2 h-4 w-4 cursor-pointer"
        onMouseEnter={toggle}
        onMouseLeave={toggle}
      />
    </div>
  );
};
