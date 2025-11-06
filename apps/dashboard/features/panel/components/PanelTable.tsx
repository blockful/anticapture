"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  SkeletonRow,
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
  Button,
} from "@/shared/components";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { useScreenSize, useTokenData, useActiveSupply } from "@/shared/hooks";
import {
  ArrowUpDown,
  ArrowState,
  DaoAvatarIcon,
} from "@/shared/components/icons";
import { formatNumberUserReadable } from "@/shared/utils";
import { StageTag } from "@/features/resilience-stages/components";
import { Stage } from "@/shared/types/enums/Stage";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { Table } from "@/shared/components/design-system/table/Table";

type PanelDao = {
  dao: string;
  inAnalysis?: boolean;
};

export const PanelTable = () => {
  const router = useRouter();
  const { isMobile } = useScreenSize();
  // Create refs to store the actual numeric values for sorting
  const liquidTreasuryValues = useRef<Record<number, number>>({});
  const circSupplyValues = useRef<Record<number, number>>({});
  const delegSupplyValues = useRef<Record<number, number>>({});
  const activeSupplyValues = useRef<Record<number, number>>({});

  const notOnElectionDaoIds = Object.values(DaoIdEnum).filter(
    (daoId) => daoId !== DaoIdEnum.NOUNS, // TODO remove this when Nouns is fully supported
  );
  // Create initial data
  const data = notOnElectionDaoIds.map((daoId, index) => ({
    id: index,
    dao: daoId,
  }));

  // Liquid Treasury Cell
  const LiquidTreasuryCell = ({
    daoId,
    rowIndex,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
  }) => {
    const { data: tokenData } = useTokenData(daoId);
    const treasury = tokenData?.treasury;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (treasury) {
        const numericValue = Number(BigInt(treasury) / BigInt(10 ** 18));
        liquidTreasuryValues.current[rowIndex] = numericValue;
      }
    }, [treasury, rowIndex]);

    if (!treasury) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      Number(BigInt(treasury) / BigInt(10 ** 18)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Circ. Supply Cell
  const CircSupplyCell = ({
    daoId,
    rowIndex,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
  }) => {
    const { data: tokenData } = useTokenData(daoId);
    const circulatingSupply = tokenData?.circulatingSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (circulatingSupply) {
        const numericValue = Number(
          BigInt(circulatingSupply) / BigInt(10 ** 18),
        );
        circSupplyValues.current[rowIndex] = numericValue;
      }
    }, [circulatingSupply, rowIndex]);

    if (!circulatingSupply) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      Number(BigInt(circulatingSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Deleg. Supply Cell (separate from DelegatedSupplyCell which uses refs for sorting)
  const DelegSupplyCell = ({
    daoId,
    rowIndex,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
  }) => {
    const { data: tokenData } = useTokenData(daoId);
    const delegatedSupply = tokenData?.delegatedSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (delegatedSupply) {
        const numericValue = Number(BigInt(delegatedSupply) / BigInt(10 ** 18));
        delegSupplyValues.current[rowIndex] = numericValue;
      }
    }, [delegatedSupply, rowIndex]);

    if (!delegatedSupply) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      Number(BigInt(delegatedSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Active Supply Cell
  const ActiveSupplyCell = ({
    daoId,
    rowIndex,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
  }) => {
    const { data: activeSupplyData } = useActiveSupply(
      daoId,
      TimeInterval.NINETY_DAYS,
    );

    const activeSupply = activeSupplyData?.activeSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (activeSupply) {
        const numericValue = Number(BigInt(activeSupply) / BigInt(10 ** 18));
        activeSupplyValues.current[rowIndex] = numericValue;
      }
    }, [activeSupply, rowIndex]);

    if (activeSupplyData === undefined) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    if (!activeSupply) {
      return (
        <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
          N/A
        </div>
      );
    }

    const formattedValue = formatNumberUserReadable(
      Number(BigInt(activeSupply) / BigInt(10 ** 18)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full gap-3"}>
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
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header">DAO</h4>,
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "chain",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const ChainIcon =
          daoConfigByDaoId[dao as DaoIdEnum].daoOverview.chain.icon;
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full items-center gap-3"}>
              <ChainIcon className="size-6 rounded-full" />
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header">Chain</h4>,
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
      accessorKey: "liquidTreasury",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return <LiquidTreasuryCell daoId={daoId} rowIndex={rowIndex} />;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Liquid Treasury
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
        const valueA = liquidTreasuryValues.current[indexA] || 0;
        const valueB = liquidTreasuryValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },

    {
      accessorKey: "circSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return <CircSupplyCell daoId={daoId} rowIndex={rowIndex} />;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Circ. Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
        const valueA = circSupplyValues.current[indexA] || 0;
        const valueB = circSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },

    {
      accessorKey: "delegSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return <DelegSupplyCell daoId={daoId} rowIndex={rowIndex} />;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Deleg. Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0 ",
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
        const valueA = delegSupplyValues.current[indexA] || 0;
        const valueB = delegSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "activeSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return <ActiveSupplyCell daoId={daoId} rowIndex={rowIndex} />;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Active Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
        const valueA = activeSupplyValues.current[indexA] || 0;
        const valueB = activeSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
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
