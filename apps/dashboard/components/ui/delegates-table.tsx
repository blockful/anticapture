"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { Button } from "./button";
import { ArrowUpDown, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { bulkGetEnsName, User } from "@/lib/server/utils";
import { sanitizeNumber } from "@/lib/client/utils";
import { Delegates, delegatesData } from "@/lib/mocked-data";
import { HeartIcon } from "./HeartIcon";

export const delegatesColumns: ColumnDef<Delegates>[] = [
  {
    accessorKey: "user",
    cell: ({ row }) => {
      const user: User = row.getValue("user");

      const ensName = user.ensName;
      const walletAddress = user.walletAddress;

      const etherscanAddressURL: string = `https://etherscan.io/address/${user.walletAddress}`;
      const ensDomainsAccountURL: string = `https://app.ens.domains/${ensName}`;

      return (
        <p className="max-w-40 overflow-auto flex items-center space-x-1 scrollbar-none">
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
    header: "Delegate",
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
  const [data, setData] = useState<Delegates[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    bulkGetEnsName(delegatesData.map((holder) => holder.user.walletAddress))
      .then((ensNames) => {
        const data = delegatesData.map((holder, idx) => {
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
      title="Delegates"
      icon={<HeartIcon />}
      isLoading={isLoading}
      withSorting={true}
      withPagination={true}
      filterColumn={"ensNameAndAddress"}
      columns={delegatesColumns}
      data={data}
    />
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
