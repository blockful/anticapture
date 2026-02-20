"use client";

import { useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DaoIdEnum } from "@/shared/types/daos";
import { Table } from "@/shared/components/design-system/table/Table";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import {
  SortableColumnHeader,
  TitleUnderlined,
} from "@/features/panel/components/SortableColumnHeader";
import {
  DaoCell,
  ChainCell,
  StageCell,
  RiskAreasCell,
  CostOfAttackCell,
  AttackProfitabilityCell,
  ActiveTokensCell,
} from "@/features/panel/components/cells";

type PanelDao = {
  dao: string;
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

  const data = Object.values(DaoIdEnum).map((daoId) => ({
    dao: daoId,
  }));

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "dao",
      cell: ({ row }) => <DaoCell daoId={row.getValue("dao") as DaoIdEnum} />,
      header: () => <h4 className="text-table-header px-4 py-3">DAO</h4>,
      meta: { columnClassName: "w-auto px-0 py-0" },
    },
    {
      accessorKey: "chain",
      cell: ({ row }) => <ChainCell daoId={row.getValue("dao") as DaoIdEnum} />,
      header: () => <h4 className="text-table-header">Chain</h4>,
      meta: { columnClassName: "w-auto" },
    },
    {
      accessorKey: "stage",
      cell: ({ row }) => <StageCell daoId={row.getValue("dao") as DaoIdEnum} />,
      header: () => (
        <div className="w-full justify-end px-0 text-left lg:px-4">
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
      meta: { columnClassName: "w-40 px-0 py-0" },
    },
    {
      accessorKey: "riskareas",
      cell: ({ row }) => (
        <RiskAreasCell daoId={row.getValue("dao") as DaoIdEnum} />
      ),
      header: () => (
        <div className="w-full justify-end px-0 text-left lg:px-4">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Assess critical vulnerabilities in the DAO&apos;s governance
                  setup. Each item highlights a specific risk area, showing
                  which issues are resolved and which still expose the system to
                  threats.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Risk Areas" className="text-left" />
          </Tooltip>
        </div>
      ),
      meta: { columnClassName: "w-56 px-0 py-0" },
    },
    {
      accessorKey: "costOfAttack",
      cell: ({ row }) => (
        <CostOfAttackCell
          daoId={row.getValue("dao") as DaoIdEnum}
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
      meta: { columnClassName: "w-auto px-0 py-0" },
    },
    {
      accessorKey: "attackProfitability",
      cell: ({ row }) => (
        <AttackProfitabilityCell
          daoId={row.getValue("dao") as DaoIdEnum}
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
          tooltipContent="Compares the Cost of Attack with how much value could be taken from the treasury and TVL. A high value means an attack may be financially attractive. A low value does not guarantee safety."
        />
      ),
      enableSorting: true,
      sortingFn: createSortingFn(attackProfitabilitySort),
      meta: { columnClassName: "w-auto" },
    },
    {
      accessorKey: "activeTokensInGovernance",
      cell: ({ row }) => (
        <ActiveTokensCell
          daoId={row.getValue("dao") as DaoIdEnum}
          onSortValueChange={createSortValueHandler(
            activeTokensSort,
            row.index,
          )}
        />
      ),
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
      meta: { columnClassName: "w-auto px-0 py-0" },
    },
  ];

  return (
    <Table
      columns={panelColumns}
      data={data}
      withSorting={true}
      stickyFirstColumn={true}
    />
  );
};
