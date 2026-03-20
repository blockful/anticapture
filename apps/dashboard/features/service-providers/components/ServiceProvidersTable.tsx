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

  // Total pixel width of all year2 columns combined — used for the "1Y only" overlay
  const year2TotalWidth = year2Cols.length * 140;

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
    year2ColIndex?: number,
  ): ColumnDef<ProviderRow> => {
    const key = quarterKey(col);
    const isYear2 = year2ColIndex !== undefined;
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
          <span className="text-primary text-xs font-medium">
            {col.year}/{col.quarter}
            {isCurrentQuarter && (
              <span className="text-secondary ml-1 font-normal">(Current)</span>
            )}
          </span>
          <span className="text-secondary text-xs font-normal">
            {meta?.dueDateLabel}
          </span>
        </div>
      ),
      cell: ({ row }: { row: { original: ProviderRow } }) => {
        if (isLoading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-20"
            />
          );
        }

        const { status, reportUrl } = row.original.quarters[key];

        if (status === "1y_only" && isYear2) {
          // First year2 cell renders a wide overlay that visually spans all year2 columns
          if (year2ColIndex === 0) {
            return (
              <div
                className="bg-surface-contrast absolute inset-y-0 left-0 z-10 flex items-center justify-center"
                style={{ width: year2TotalWidth }}
              >
                <span className="text-dimmed text-sm font-normal italic">
                  1Y only
                </span>
              </div>
            );
          }
          // Subsequent year2 cells are visually covered by the first cell's overlay
          return null;
        }

        return <StatusCell status={status} reportUrl={reportUrl} />;
      },
      meta: { columnClassName: "w-[140px] px-2 relative" },
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
        columnClassName:
          "w-[220px] px-2 sticky left-0 z-20 [&:is(th)]:bg-surface-contrast bg-surface-default border-r border-border-default",
      },
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary h-full w-full flex-col items-start justify-center gap-0 p-0"
          onClick={() => column.toggleSorting()}
        >
          <div className="flex items-center gap-1">
            <span className="text-table-header whitespace-nowrap">Budget/</span>
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
          </div>
          <span className="text-table-header whitespace-nowrap font-normal">
            Stream Duration
          </span>
        </Button>
      ),
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-16"
          />
        ) : (
          <div className="flex flex-col">
            <span className="text-secondary text-sm">
              {formatNumberUserReadable(row.original.budget)}
            </span>
            {spp === "SPP2" && (
              <span
                className={cn(
                  "text-xs",
                  row.original.streamDuration === 2
                    ? "text-blue-400"
                    : "text-pink-500",
                )}
              >
                {row.original.streamDuration === 2 ? "2 years" : "1 year"}
              </span>
            )}
          </div>
        ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.original.budget - rowB.original.budget,
      meta: { columnClassName: "w-[152px]" },
    },
    ...year1Cols.map((col) => buildQuarterColumn(col)),
    ...year2Cols.map((col, i) => buildQuarterColumn(col, i)),
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
