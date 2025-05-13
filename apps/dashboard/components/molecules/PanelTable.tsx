"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PanelDao } from "@/lib/mocked-data/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ArrowState,
  BadgeInAnalysis,
  TheTable,
  SkeletonRow,
  DaoAvatarIcon,
  Stage,
  StageTag,
} from "@/components/atoms";
import { cn, formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useDelegatedSupply } from "@/hooks";
import daoConfigByDaoId from "@/lib/dao-config";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { getDaoStageFromFields, fieldsToArray } from "@/lib/dao-config/utils";
import {
  RiskAreaCardWrapper,
  RiskAreaCardEnum,
} from "@/components/molecules/RiskAreaCard";
import { getDaoRiskAreas } from "@/lib/utils/risk-analysis";

export const PanelTable = ({ days }: { days: TimeInterval }) => {
  const router = useRouter();
  const { isMobile } = useScreenSize();
  // Create a ref to store the actual delegated supply values
  const delegatedSupplyValues = useRef<Record<number, number>>({});

  const notOnElectionDaoIds = Object.values(DaoIdEnum).filter(
    (daoId) =>
      daoConfigByDaoId[daoId].supportStage !== SupportStageEnum.ELECTION,
  );
  // Create initial data
  const data = notOnElectionDaoIds.map((daoId, index) => ({
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
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedSupply = formatNumberUserReadable(
      Number(BigInt(supplyData.currentDelegatedSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="flex items-center justify-end px-4 py-3 text-end text-white">
        {formattedSupply}
      </div>
    );
  };

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "#",
      size: 60,
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoConfigByDaoId[dao as DaoIdEnum] : null;
        return (
          <div className="flex min-h-[68px] items-center justify-center gap-3 sm:min-h-0">
            <p className="scrollbar-none flex items-center overflow-auto py-3 text-foreground">
              {row.index + 1}
            </p>
            {isMobile && details && (
              <DaoAvatarIcon
                daoId={dao as DaoIdEnum}
                className="size-icon-md"
                isRounded
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
            <h4 className="text-table-header">#</h4>
            <ArrowUpDown
              props={{
                className: "size-4",
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
        const details = dao ? daoConfigByDaoId[dao as DaoIdEnum] : null;
        const isInAnalysis =
          details?.supportStage === SupportStageEnum.ANALYSIS;
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto px-4 py-3 text-white sm:py-3.5">
            <div
              className={cn("flex w-full gap-3 md:w-64", {
                "whitespace-nowrap": isMobile,
                "!w-fit": !isMobile && isInAnalysis,
              })}
            >
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <DaoAvatarIcon
                    daoId={dao as DaoIdEnum}
                    className="size-icon-sm"
                    isRounded
                  />
                )}
                {daoConfigByDaoId[dao as DaoIdEnum].name ===
                daoConfigByDaoId[DaoIdEnum.ENS].name
                  ? "ENS"
                  : daoConfigByDaoId[dao as DaoIdEnum].name}
              </div>
              {!isMobile && isInAnalysis && (
                <div className="flex w-full">
                  <BadgeInAnalysis />
                </div>
              )}
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">DAO</h4>,
    },
    {
      accessorKey: "stage",
      size: 155,
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const daoConfig = daoConfigByDaoId[daoId];
        if (!daoConfig.governanceImplementation) {
          return (
            <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto px-4 py-3 text-white sm:py-3.5">
              <StageTag daoStage={Stage.NONE} tagStage={Stage.NONE} />
            </div>
          );
        }
        const stage = getDaoStageFromFields(
          fieldsToArray(daoConfig.governanceImplementation?.fields),
        );
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto px-4 py-3 text-white sm:py-3.5">
            <StageTag daoStage={stage} tagStage={stage} />
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">Stage</h4>,
    },
    {
      accessorKey: "riskareas",
      size: 220,
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const daoRiskAreas = getDaoRiskAreas(daoId);
        const riskAreas = {
          risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
            name,
            level: info.riskLevel,
          })),
        };

        return (
          <div className="scrollbar-none flex w-full items-center overflow-auto px-4 py-3 text-white">
            <RiskAreaCardWrapper
              riskAreas={riskAreas.risks}
              variant={RiskAreaCardEnum.PANEL_TABLE}
              className="flex w-full flex-row gap-1"
              withTitle={false}
            />
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">Risk Areas</h4>,
    },
    {
      accessorKey: "delegatedSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        const isInAnalysis =
          daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ANALYSIS;
        if (isInAnalysis) {
          return (
            <div className="flex items-center justify-end px-4 py-3 text-end">
              {"-"}
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
          className="flex w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Delegated Supply</h4>
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

  const handleRowClick = (row: PanelDao) => {
    row.dao && router.push(`/${row.dao.toLowerCase()}`);
  };

  return (
    <TheTable
      columns={panelColumns}
      data={data}
      withPagination={true}
      withSorting={true}
      onRowClick={handleRowClick}
      disableRowClick={(row: PanelDao) =>
        !!daoConfigByDaoId[row.dao as DaoIdEnum].disableDaoPage
      }
    />
  );
};
