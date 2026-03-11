"use client";

import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { useRef, useState } from "react";

import { cn } from "@/shared/utils/cn";
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
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";

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

const TABS = {
  FULLY_ANALYZED: "fully-analyzed",
  NOT_REVIEWED: "not-reviewed",
} as const;

type TabValue = (typeof TABS)[keyof typeof TABS];

export const PanelTable = () => {
  const [activeTab, setActiveTab] = useState<TabValue>(TABS.FULLY_ANALYZED);
  const costOfAttackSort = useRef<Record<number, number>>({});
  const attackProfitabilitySort = useRef<Record<number, number>>({});
  const activeTokensSort = useRef<Record<number, number>>({});

  const allDaos = Object.values(DaoIdEnum).map((daoId) => ({
    dao: daoId,
  }));

  const fullyAnalyzedDaos = allDaos.filter(
    ({ dao }) => !!daoConfigByDaoId[dao].governanceImplementation,
  );
  const notReviewedDaos = allDaos.filter(
    ({ dao }) => !daoConfigByDaoId[dao].governanceImplementation,
  );

  const data =
    activeTab === TABS.FULLY_ANALYZED ? fullyAnalyzedDaos : notReviewedDaos;

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "dao",
      cell: ({ row }) => <DaoCell daoId={row.getValue("dao") as DaoIdEnum} />,
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
      cell: ({ row }) => <ChainCell daoId={row.getValue("dao") as DaoIdEnum} />,
      header: () => <h4 className="text-table-header">Chain</h4>,
      meta: { columnClassName: "w-[8%]" },
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
      meta: { columnClassName: "w-[10%] px-0 py-0" },
    },
    {
      accessorKey: "riskareas",
      cell: ({ row }) => (
        <RiskAreasCell
          daoId={row.getValue("dao") as DaoIdEnum}
          disabled={activeTab === TABS.NOT_REVIEWED}
        />
      ),
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
      meta: { columnClassName: "w-[15%] px-0 py-0" },
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
        if (activeTab === TABS.FULLY_ANALYZED) {
          return (
            <ActiveTokensCell
              daoId={row.getValue("dao") as DaoIdEnum}
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
    <div className="flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="mb-4 flex border-b border-b-white/10">
          <TabsTrigger
            value={TABS.FULLY_ANALYZED}
            className={cn(
              "text-secondary relative flex cursor-pointer items-center gap-2 whitespace-nowrap px-2 py-2 text-xs font-medium",
              "data-[state=active]:text-link",
              "after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-transparent after:content-['']",
              "data-[state=active]:after:bg-surface-solid-brand",
            )}
          >
            Fully Analyzed
            <span className="bg-surface-contrast text-secondary rounded-full px-1.5 py-0.5 text-xs">
              {fullyAnalyzedDaos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={TABS.NOT_REVIEWED}
            className={cn(
              "text-secondary relative flex cursor-pointer items-center gap-2 whitespace-nowrap px-2 py-2 text-xs font-medium",
              "data-[state=active]:text-link",
              "after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-transparent after:content-['']",
              "data-[state=active]:after:bg-surface-solid-brand",
            )}
          >
            Not Reviewed
            <span className="bg-surface-contrast text-secondary rounded-full px-1.5 py-0.5 text-xs">
              {notReviewedDaos.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Table
        columns={panelColumns}
        data={data}
        withSorting={true}
        stickyFirstColumn={true}
      />
    </div>
  );
};
