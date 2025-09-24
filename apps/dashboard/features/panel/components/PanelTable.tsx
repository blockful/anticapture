"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PanelDao } from "@/shared/constants/mocked-data/mocked-data";
import { Button } from "@/shared/components/ui/button";
import {
  BadgeInAnalysis,
  SkeletonRow,
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
} from "@/shared/components";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useDelegatedSupply } from "@/shared/hooks";
import daoConfigByDaoId from "@/shared/dao-config";
import { useScreenSize } from "@/shared/hooks";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import {
  ArrowUpDown,
  ArrowState,
  DaoAvatarIcon,
} from "@/shared/components/icons";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { StageTag } from "@/features/resilience-stages/components";
import { Stage } from "@/shared/types/enums/Stage";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { Table } from "@/shared/components/design-system/table/Table";

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
      <div className="text-secondary flex w-full items-center justify-end px-4 py-3 text-end text-sm font-normal">
        {formattedSupply}
      </div>
    );
  };

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "#",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoConfigByDaoId[dao as DaoIdEnum] : null;
        return (
          <div className="flex min-h-[68px] w-full items-center justify-center gap-3 pr-3 sm:min-h-0">
            <p className="scrollbar-none text-secondary flex items-center overflow-auto py-3">
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
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            className="h-min gap-2 p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
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
      meta: {
        columnClassName: "w-10",
      },
    },
    {
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoConfigByDaoId[dao as DaoIdEnum] : null;
        const isInAnalysis =
          details?.supportStage === SupportStageEnum.ANALYSIS;
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto px-4">
            <div
              className={cn("flex w-full gap-3", {
                "w-full flex-col md:w-fit lg:flex-row": isInAnalysis,
              })}
            >
              <div className="flex w-full items-center gap-1.5">
                {!isMobile && (
                  <DaoAvatarIcon
                    daoId={dao as DaoIdEnum}
                    className="size-icon-sm"
                    isRounded
                  />
                )}
                <p className="text-primary text-sm font-medium">
                  {daoConfigByDaoId[dao as DaoIdEnum].name ===
                  daoConfigByDaoId[DaoIdEnum.ENS].name
                    ? "ENS"
                    : daoConfigByDaoId[dao as DaoIdEnum].name}
                </p>
              </div>
              {isInAnalysis && (
                <>
                  <div className="hidden w-full items-center lg:flex">
                    <BadgeInAnalysis />
                  </div>
                  <div className="flex w-full items-center lg:hidden">
                    <BadgeInAnalysis hasIcon={false} />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">DAO</h4>,
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "stage",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const daoConfig = daoConfigByDaoId[daoId];
        if (!daoConfig.governanceImplementation) {
          return (
            <div className="scrollbar-none text-primary flex items-center gap-3 space-x-1 overflow-auto">
              <StageTag
                daoStage={Stage.UNKNOWN}
                tagStage={Stage.UNKNOWN}
                showStageText
              />
            </div>
          );
        }
        const stage = getDaoStageFromFields({
          fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
          noStage: daoConfig.noStage,
        });

        return (
          <div className="scrollbar-none text-primary flex items-center gap-3 space-x-1 overflow-auto">
            <StageTag daoStage={stage} tagStage={stage} showStageText />
          </div>
        );
      },
      header: () => <h4 className="text-table-header">Stage</h4>,
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "riskareas",
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
          <div className="scrollbar-none text-primary flex w-full items-center overflow-auto">
            <RiskAreaCardWrapper
              riskAreas={riskAreas.risks}
              variant={RiskAreaCardEnum.PANEL_TABLE}
              className="flex w-full flex-row gap-1"
              withTitle={false}
            />
          </div>
        );
      },
      header: () => <h4 className="text-table-header w">Risk Areas</h4>,
      meta: {
        columnClassName: "w-56",
      },
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
            <div className="justify-endtext-end flex items-center">{"-"}</div>
          );
        }
        return (
          <DelegatedSupplyCell daoId={daoId} rowIndex={rowIndex} days={days} />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex h-min w-full justify-end p-0"
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
    <Table
      columns={panelColumns}
      data={data}
      withSorting={true}
      onRowClick={handleRowClick}
      disableRowClick={(row: PanelDao) =>
        !!daoConfigByDaoId[row.dao as DaoIdEnum].disableDaoPage
      }
    />
  );
};
