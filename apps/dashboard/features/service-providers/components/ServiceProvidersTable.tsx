"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ProviderNameCell } from "@/features/service-providers/components/ProviderNameCell";
import { StatusCell } from "@/features/service-providers/components/StatusCell";
import {
  ENS_SERVICE_PROVIDERS,
  QUARTER_DUE_DATES,
  SPP1_YEAR_QUARTERS,
  SPP2_YEAR1_QUARTERS,
  SPP2_YEAR2_QUARTERS,
} from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterReport,
  type ServiceProvider,
  type SPPKey,
} from "@/features/service-providers/types";
import { getCurrentQuarter } from "@/features/service-providers/utils/getQuarterInfos";
import { Button } from "@/shared/components";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { cn, formatNumberUserReadable } from "@/shared/utils";

type QuarterColumn = { year: number; quarter: "Q1" | "Q2" | "Q3" | "Q4" };

interface ProviderRow {
  name: string;
  avatarUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  streamDuration: 1 | 2;
  quarters: Record<string, QuarterReport>;
}

const quarterKey = (col: QuarterColumn) => `${col.year}_${col.quarter}`;

const makeSkeletonRow = (cols: QuarterColumn[]): ProviderRow => ({
  name: "",
  budget: 0,
  streamDuration: 1,
  quarters: Object.fromEntries(
    cols.map((col) => [quarterKey(col), { status: "upcoming" as const }]),
  ),
});

interface ServiceProvidersTableProps {
  providers: ServiceProvider[];
  spp: SPPKey;
  isLoading?: boolean;
}

export const ServiceProvidersTable = ({
  providers,
  spp,
  isLoading = false,
}: ServiceProvidersTableProps) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  const year1Cols = spp === "SPP1" ? SPP1_YEAR_QUARTERS : SPP2_YEAR1_QUARTERS;
  const year2Cols = spp === "SPP2" ? SPP2_YEAR2_QUARTERS : [];
  const allCols = [...year1Cols, ...year2Cols];

  const sppProviderList = ENS_SERVICE_PROVIDERS.filter((p) =>
    p.sppPrograms.includes(spp),
  );

  const skeletonRows: ProviderRow[] = Array.from(
    { length: sppProviderList.length },
    () => makeSkeletonRow(allCols),
  );

  const data: ProviderRow[] = isLoading
    ? skeletonRows
    : providers
        .filter((p) => p.sppPrograms.includes(spp))
        .map((provider) => {
          const reportsByQuarter: Record<string, QuarterReport> = {};

          for (const col of year1Cols) {
            const yearData = provider.years[col.year];
            reportsByQuarter[quarterKey(col)] = yearData?.[col.quarter] ?? {
              status: "upcoming",
            };
          }

          for (const col of year2Cols) {
            reportsByQuarter[quarterKey(col)] =
              provider.streamDuration === 1
                ? { status: "1y_only" }
                : (provider.years[col.year]?.[col.quarter] ?? {
                    status: "upcoming",
                  });
          }

          return {
            name: provider.name,
            avatarUrl: provider.avatarUrl,
            websiteUrl: provider.websiteUrl,
            proposalUrl: provider.proposalUrl,
            budget: provider.budget,
            streamDuration: provider.streamDuration,
            quarters: reportsByQuarter,
          };
        });

  const buildQuarterColumn = (
    col: QuarterColumn,
    groupLabel?: string,
  ): ColumnDef<ProviderRow> => {
    const key = quarterKey(col);
    const isCurrentQuarter =
      col.year === currentYear && col.quarter === currentQuarter;
    const meta = QUARTER_DUE_DATES[col.year]?.[col.quarter];

    return {
      id: key,
      header: () => (
        <div
          className={cn(
            "flex h-full flex-col gap-0.5 px-2 py-1",
            isCurrentQuarter &&
              "bg-orange-400/12 border-1 border-surface-solid-brand",
          )}
        >
          {groupLabel && (
            <span className="text-secondary mb-0.5 text-[10px] font-medium uppercase tracking-wider">
              {groupLabel}
            </span>
          )}
          <span className="text-primary text-xs font-medium">
            {col.quarter}
            {isCurrentQuarter && (
              <span className="text-secondary ml-1 font-normal">(Current)</span>
            )}
          </span>
          <span className="text-secondary text-xs font-normal">
            {meta?.dueDateLabel}
          </span>
        </div>
      ),
      cell: ({ row }: { row: { original: ProviderRow } }) =>
        isLoading ? (
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-20"
          />
        ) : (
          <StatusCell
            status={row.original.quarters[key].status}
            reportUrl={row.original.quarters[key].reportUrl}
          />
        ),
      meta: { columnClassName: "w-[149px] px-2" },
    };
  };

  const columns: ColumnDef<ProviderRow>[] = [
    {
      accessorKey: "name",
      header: () => <span className="text-table-header">Name</span>,
      cell: ({ row }) =>
        isLoading ? (
          <div className="flex items-center gap-3">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-6 rounded-full"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-24"
            />
          </div>
        ) : (
          <ProviderNameCell
            name={row.original.name}
            avatarUrl={row.original.avatarUrl}
            websiteUrl={row.original.websiteUrl}
            proposalUrl={row.original.proposalUrl}
          />
        ),
      meta: {
        columnClassName: "w-[220px] px-2 sticky left-0 z-10 bg-surface",
      },
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap">Budget</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
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
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-16"
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="text-primary text-sm">
              {formatNumberUserReadable(row.original.budget)}
            </span>
            {spp === "SPP2" && (
              <span className="text-secondary text-xs">
                {row.original.streamDuration}Y stream
              </span>
            )}
          </div>
        ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.original.budget - rowB.original.budget,
      meta: { columnClassName: "w-[92px]" },
    },
    ...year1Cols.map((col) => buildQuarterColumn(col)),
    ...year2Cols.map((col) => buildQuarterColumn(col, "Year 2")),
  ];

  return (
    <Table
      columns={columns}
      data={data}
      wrapperClassName="overflow-x-auto overflow-y-visible"
      withDownloadCSV={true}
      withSorting={true}
      fillHeight
    />
  );
};
