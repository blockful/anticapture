"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { bulkGetEnsName, User } from "@/lib/server/utils";
import { sanitizeNumber } from "@/lib/client/utils";
import { Delegates, delegatesData } from "@/lib/mocked-data/mocked-data";
import { HeartIcon } from "@/components/atoms";

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
        <p className="scrollbar-none flex max-w-40 items-center space-x-1 overflow-auto">
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
    accessorKey: "delegators",
    cell: ({ row }) => {
      const delegators: number = row.getValue("delegators");
      return <p className="mr-4 text-center">{sanitizeNumber(delegators)}</p>;
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delegators
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "voted",
    cell: ({ row }) => {
      const delegators: number = row.getValue("voted");
      return <div className="mr-8 text-center">{delegators * 100}%</div>;
    },
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Voted
            <ArrowUpDown className="ml-2 size-4" />
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
        className={`absolute right-0 top-5 w-[220px] rounded-md bg-black p-3 text-center text-white ${
          showInfo ? "block" : "hidden"
        }`}
      >
        This is the percentage of proposals voted by this wallet in the last 90
        days.
      </div>
      <InfoIcon
        className="ml-2 size-4 cursor-pointer"
        onMouseEnter={toggle}
        onMouseLeave={toggle}
      />
    </div>
  );
};
