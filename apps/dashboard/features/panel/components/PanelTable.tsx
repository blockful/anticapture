"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRef } from "react";

import {
  DaoCell,
  ChainCell,
  StageCell,
  RiskAreasCell,
  CostOfAttackCell,
  AttackProfitabilityCell,
  ActiveTokensCell,
} from "@/features/panel/components/cells";
import {
  SortableColumnHeader,
  TitleUnderlined,
} from "@/features/panel/components/SortableColumnHeader";
import { Table } from "@/shared/components/design-system/table/Table";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { BadgeStatus } from "@/shared/components/design-system/badges";

type PanelDao = {
  dao: DaoIdEnum;
  isPartiallyIndexed: boolean;
};

type SortValuesRef = React.RefObject<Record<number, number>>;

const createSortValueHandler = (ref: SortValuesRef, rowIndex: number) => {
  return (value: number | null) => {
    if (value != null) {
      ref.current[rowIndex] = value;
    } else {
      delete ref.current[rowIndex];
    }
  };
};

const createSortingFn = (ref: SortValuesRef) => {
  return (rowA: { index: number }, rowB: { index: number }) =>
    (ref.current[rowA.index] ?? 0) - (ref.current[rowB.index] ?? 0);
};

export const PanelTable = () => {
  const costOfAttackSort = useRef<Record<number, number>>({});
  const attackProfitabilitySort = useRef<Record<number, number>>({});
  const activeTokensSort = useRef<Record<number, number>>({});

  const allDaos = Object.values(DaoIdEnum)
    .map((daoId) => ({
      dao: daoId,
      isPartiallyIndexed: !daoConfigByDaoId[daoId].governanceImplementation,
    }))
    .sort(
      (daoA, daoB) =>
        Number(daoA.isPartiallyIndexed) - Number(daoB.isPartiallyIndexed),
    );

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "dao",
      cell: ({ row }) => <DaoCell daoId={row.original.dao} />,
      header: () => (
        <>
          <h4 className="text-table-header hidden px-4 py-3 md:block">
            Organizations
          </h4>
          <h4 className="text-table-header px-4 py-3 md:hidden">Orgs</h4>
        </>
      ),
      meta: { columnClassName: "w-[18%] px-0 py-0" },
    },
    {
      accessorKey: "chain",
      cell: ({ row }) => <ChainCell daoId={row.original.dao} />,
      header: () => <h4 className="text-table-header">Chain</h4>,
      meta: { columnClassName: "w-[8%]" },
    },
    {
      accessorKey: "stage",
      cell: ({ row }) => <StageCell daoId={row.original.dao} />,
      header: () => (
        <div className="w-full justify-end px-0 text-left">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Resilience Stages are based on governance mechanisms, using
                  the riskiest exposed vector as the criterion for progression.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Stage" className="text-left" />
          </Tooltip>
        </div>
      ),
      meta: { columnClassName: "w-[10%] px-0 py-0" },
    },
    {
      accessorKey: "riskareas",
      cell: ({ row }) => {
        const { dao: daoId, isPartiallyIndexed } = row.original;
        return <RiskAreasCell daoId={daoId} disabled={isPartiallyIndexed} />;
      },
      header: () => (
        <div className="w-full justify-end px-0 text-left lg:px-4">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Assess critical vulnerabilities in the DAO&apos;s governance
                  setup. Each item highlights a specific attack exposure,
                  showing which issues are resolved and which still expose the
                  system to threats.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Attack Exposure" className="text-left" />
          </Tooltip>
        </div>
      ),
      meta: { columnClassName: "w-[18%] px-0 py-0" },
    },
    {
      accessorKey: "costOfAttack",
      cell: ({ row }) => (
        <CostOfAttackCell
          daoId={row.original.dao}
          onSortValueChange={createSortValueHandler(
            costOfAttackSort,
            row.index,
          )}
        />
      ),
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title="Cost of Attack"
          tooltipContent="Estimates the capital required to obtain governance control based on recent active voting power. A low cost relative to the treasury indicates a higher risk of economic governance capture."
        />
      ),
      enableSorting: true,
      sortingFn: createSortingFn(costOfAttackSort),
      meta: { columnClassName: "w-[15%] px-0 py-0" },
    },
    {
      accessorKey: "attackProfitability",
      cell: ({ row }) => (
        <AttackProfitabilityCell
          daoId={row.original.dao}
          onSortValueChange={createSortValueHandler(
            attackProfitabilitySort,
            row.index,
          )}
        />
      ),
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title="Attack Profitability"
          tooltipContent="Compares the Cost of Attack with how much value could be taken from the treasury. A high value means an attack may be financially attractive. A low value does not guarantee safety."
        />
      ),
      enableSorting: true,
      sortingFn: createSortingFn(attackProfitabilitySort),
      meta: { columnClassName: "w-[16%]" },
    },
    {
      accessorKey: "activeTokensInGovernance",
      cell: ({ row }) => {
        const { dao: daoId, isPartiallyIndexed } = row.original;
        if (!isPartiallyIndexed) {
          return (
            <ActiveTokensCell
              daoId={daoId}
              onSortValueChange={createSortValueHandler(
                activeTokensSort,
                row.index,
              )}
            />
          );
        }
        return (
          <Tooltip
            tooltipContent={
              <p className="text-secondary text-sm font-normal leading-5">
                Economic security data is not yet available. Our team is
                actively working to integrate it.
              </p>
            }
            title={"No data available"}
            className="text-left"
            triggerClassName="w-full"
          >
            <div className="ml-auto w-fit px-2">
              <BadgeStatus variant="dimmed">No Data</BadgeStatus>
            </div>
          </Tooltip>
        );
      },
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title="Active Tokens in Governance"
          tooltipContent="Percentage of circulating supply that actively voted in the last 90 days, indicating how quickly the DAO can mobilize against an attack."
          className="px-4"
        />
      ),
      enableSorting: true,
      sortingFn: createSortingFn(activeTokensSort),
      meta: { columnClassName: "w-[15%] px-0 py-0" },
    },
  ];

  return (
    <Table
      columns={panelColumns}
      data={allDaos}
      withSorting={true}
      fillHeight={true}
      wrapperClassName="min-h-[400px]"
      stickyFirstColumn={true}
      pinRowsToBottom={(row) => row.isPartiallyIndexed}
      getRowClassName={(row, index, rows) => {
        const noFirstColumnBorder = "[&>td:first-child]:border-r-0";

        if (!row.isPartiallyIndexed) return noFirstColumnBorder;

        const previousRow = rows[index - 1];
        const isFirstPartiallyIndexedRow = !previousRow?.isPartiallyIndexed;

        return [
          noFirstColumnBorder,
          "[&_td]:bg-surface-background [&_td]:text-secondary/80",
          isFirstPartiallyIndexedRow
            ? "[&_td]:border-t [&_td]:border-solid [&_td]:border-light-dark lg:[&_td:first-child]:border-t lg:[&_td:first-child]:border-solid lg:[&_td:first-child]:border-light-dark"
            : "",
        ].join(" ");
      }}
    />
  );
};
