/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useRef } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DashboardDao } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  TheTable,
  ArrowState,
  SkeletonRow,
} from "@/components/atoms";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useDelegatedSupply } from "@/hooks";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { BadgeInAnalysis } from "../atoms/BadgeInAnalysis";
import { useScreenSize } from "@/lib/hooks/useScreenSize";

export const DashboardTable = ({ days }: { days: TimeInterval }) => {
  const router = useRouter();
  const { isMobile, isTablet } = useScreenSize();
  // Create a ref to store the actual delegated supply values
  const delegatedSupplyValues = useRef<Record<number, number>>({});

  // Create initial data
  const data = Object.values(DaoIdEnum).map((daoId, index) => ({
    id: index,
    dao: daoId,
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
      return <SkeletonRow className="h-5 w-full max-w-20 md:max-w-32" />;
    }

    const formattedSupply = formatNumberUserReadable(
      Number(BigInt(supplyData.currentDelegatedSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="flex items-center justify-end px-4 py-3 text-end text-white">
        {formattedSupply} |{" "}
        <div className="pl-1 text-sm">
          ({(Number(supplyData.changeRate || 0) * 100).toFixed(2)}%)
        </div>
      </div>
    );
  };

  const dashboardColumns: ColumnDef<DashboardDao>[] = [
    {
      accessorKey: "#",
      size: 60,
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoConstantsByDaoId[dao as DaoIdEnum] : null;
        return (
          <div className="flex items-center justify-center gap-3">
            <p className="scrollbar-none items-centeroverflow-auto flex py-3 text-foreground">
              {row.index + 1}
            </p>
            {isMobile && details && (
              <Image
                className="overflow-hidden rounded-full"
                src={details.icon}
                alt={"OK"}
                width={24}
                height={24}
              />
            )}
          </div>
        );
      },
      header: ({ column }) => (
        <div className="flex w-full items-center justify-center">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <h4 className="font-normal">#</h4>
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
        </div>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.index - rowB.index,
    },
    {
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoConstantsByDaoId[dao as DaoIdEnum] : null;
        return (
          <div className="scrollbar-none flex w-full items-center gap-2 space-x-1 overflow-auto px-4 py-3 text-[#fafafa]">
            <div className="flex w-5 items-center gap-2 md:w-20">
              {!isMobile && details && (
                <Image
                  className="overflow-hidden rounded-full"
                  src={details.icon}
                  alt={"OK"}
                  width={24}
                  height={24}
                />
              )}
              {dao}
            </div>
            {!isMobile && details?.inAnalysis && <BadgeInAnalysis />}
          </div>
        );
      },
      header: () => <h4 className="pl-4 font-normal">DAO</h4>,
    },
    {
      accessorKey: "delegatedSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        if (daoConstantsByDaoId[daoId].inAnalysis) {
          return (
            <div className="flex items-center justify-end px-4 py-3 text-end">
              {isMobile ? <BadgeInAnalysis /> : "-"}
            </div>
          );
        }
        return (
          <DelegatedSupplyCell daoId={daoId} rowIndex={rowIndex} days={days} />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="truncate font-normal">
            Delegated Supply {!isMobile && `(${days})`}
          </h4>
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
      disableRowClick={(row: DashboardDao) =>
        !!daoConstantsByDaoId[row.dao as DaoIdEnum].inAnalysis
      }
    />
  );
};
