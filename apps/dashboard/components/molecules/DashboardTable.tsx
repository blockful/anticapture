/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DashboardDao, dashboardData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TheTable, ArrowState } from "@/components/atoms";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import Image, { StaticImageData } from "next/image";
import ENSLogo from "@/public/logo/ENS.png";
import UNILogo from "@/public/logo/UNI.png";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useDelegatedSupply } from "@/hooks/useDelegatedSupply";

const daoDetails: Record<
  DaoIdEnum,
  { icon: StaticImageData; tooltip: string }
> = {
  [DaoIdEnum.UNISWAP]: {
    icon: UNILogo,
    tooltip: "Total current value of tokens in circulation.",
  },
  [DaoIdEnum.ENS]: {
    icon: ENSLogo,
    tooltip: "",
  },
};

export const SkeletonRow = ({ width = "w-32", height = "h-5" }) => {
  return (
    <div className={`flex animate-pulse justify-center space-x-2`}>
      <div className={`${width} ${height} rounded bg-gray-300`} />
    </div>
  );
};

export const DashboardTable = ({ days }: { days: TimeInterval }) => {
  const router = useRouter();

  // Create a ref to store the actual delegated supply values
  const delegatedSupplyValues = useRef<Record<number, number>>({});

  // Create initial data
  const data = Object.values(DaoIdEnum).map((daoId, index) => ({
    id: index,
    dao: daoId,
    delegatedSupply: null as null | string,
    profitability: null,
    delegatesToPass: null,
  }));

  // Create a cell component that stores its value in the ref
  const DelegatedSupplyCell = ({
    daoId,
    rowIndex,
    days,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
    days: TimeInterval;
  }) => {
    const { data: supplyData } = useDelegatedSupply(daoId, String(days));

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (supplyData) {
        const numericValue = Number(
          BigInt(supplyData.currentDelegatedSupply) / BigInt(10 ** 18),
        );
        delegatedSupplyValues.current[rowIndex] = numericValue;
      }
    }, [supplyData, rowIndex]);

    if (!supplyData) {
      return <SkeletonRow />;
    }

    const formattedSupply = formatNumberUserReadable(
      Number(BigInt(supplyData.currentDelegatedSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="flex items-center justify-center text-center">
        {formattedSupply}
      </div>
    );
  };

  const dashboardColumns: ColumnDef<DashboardDao>[] = [
    {
      accessorKey: "#",
      cell: ({ row }) => (
        <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 overflow-auto px-4 text-[#fafafa]">
          {row.index + 1}
        </p>
      ),
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          #
          <ArrowUpDown
            props={{
              className: "h-4 w-4",
            }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.index - rowB.index,
    },
    {
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoDetails[dao as DaoIdEnum] : null;
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {details && (
              <Image src={details.icon} alt={"OK"} width={24} height={24} />
            )}
            {dao}
          </p>
        );
      },
      header: "DAO",
    },
    {
      accessorKey: "delegatedSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;

        return (
          <DelegatedSupplyCell daoId={daoId} rowIndex={rowIndex} days={days} />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting()}
        >
          Delegated Supply ({days})
          <ArrowUpDown
            props={{
              className: "ml-2 h-4 w-4",
            }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = delegatedSupplyValues.current[indexA] || 0;
        const valueB = delegatedSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
    },
  ];

  const handleRowClick = (row: DashboardDao) => {
    row.dao && router.push(`/${row.dao.toLowerCase()}`);
  };

  return (
    <TheTable
      columns={dashboardColumns}
      data={data}
      withPagination={true}
      withSorting={true}
      onRowClick={handleRowClick}
    />
  );
};
