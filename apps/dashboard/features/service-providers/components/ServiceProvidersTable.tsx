"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ProviderNameCell } from "@/features/service-providers/components/ProviderNameCell";
import { StatusCell } from "@/features/service-providers/components/StatusCell";
import type {
  ParsedQuarter,
  ProgramDefinition,
  QuarterReport,
  ServiceProvider,
} from "@/features/service-providers/types";
import { getDueDateLabel } from "@/features/service-providers/utils/computeQuarterStatus";
import { getCurrentQuarter } from "@/features/service-providers/utils/getCurrentQuarter";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Table } from "@/shared/components/design-system/table/Table";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

const quarterKey = (col: ParsedQuarter) => `${col.year}_${col.quarter}`;

interface ProviderRow {
  name: string;
  avatarUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  streamDuration: 1 | 2;
  quarters: Record<string, QuarterReport>;
}

const makeSkeletonRow = (cols: ParsedQuarter[]): ProviderRow => ({
  name: "",
  budget: 0,
  streamDuration: 1,
  quarters: Object.fromEntries(
    cols.map((col) => [quarterKey(col), { status: "upcoming" as const }]),
  ),
});

interface ServiceProvidersTableProps {
  providers: ServiceProvider[];
  program: ProgramDefinition;
  isLoading?: boolean;
}

export const ServiceProvidersTable = ({
  providers,
  program,
  isLoading = false,
}: ServiceProvidersTableProps) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  const { year1Quarters, year2Quarters } = program;
  const allCols = [...year1Quarters, ...year2Quarters];
  const hasYear2 = year2Quarters.length > 0;

  const skeletonRows: ProviderRow[] = Array.from(
    { length: providers.length || 6 },
    () => makeSkeletonRow(allCols),
  );

  const data: ProviderRow[] = isLoading
    ? skeletonRows
    : providers.map((provider) => {
        const reportsByQuarter: Record<string, QuarterReport> = {};

        for (const col of year1Quarters) {
          const yearData = provider.years[col.year];
          reportsByQuarter[quarterKey(col)] = yearData?.[col.quarter] ?? {
            status: "upcoming",
          };
        }

        for (const col of year2Quarters) {
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
    col: ParsedQuarter,
    year2ColIndex?: number,
  ): ColumnDef<ProviderRow> => {
    const key = quarterKey(col);
    const isYear2 = year2ColIndex !== undefined;
    const isCurrentQuarter =
      col.year === currentYear && col.quarter === currentQuarter;
    const dueDateLabel = getDueDateLabel(col.quarter);

    return {
      id: key,
      header: () => (
        <div
          className={cn(
            "flex h-full flex-col gap-0.5 px-2 py-1",
            isCurrentQuarter &&
              "bg-surface-opacity-brand border-1 border-surface-solid-brand",
          )}
        >
          <span className="text-primary text-xs font-medium">
            {col.year}/{col.quarter}
            {isCurrentQuarter && (
              <span className="text-secondary ml-1 font-normal">(Current)</span>
            )}
          </span>
          <span className="text-secondary text-xs font-normal">
            {dueDateLabel}
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
          return (
            <div className="bg-surface-contrast/30 absolute inset-0 flex items-center justify-center">
              {year2ColIndex === 0 && (
                <span className="text-dimmed text-sm font-normal italic">
                  1Y only
                </span>
              )}
            </div>
          );
        }

        return <StatusCell status={status} reportUrl={reportUrl} />;
      },
      meta: {
        columnClassName: cn(hasYear2 && "w-[140px]", "px-2 relative"),
      },
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
        columnClassName: cn(
          "w-[130px] sm:w-[260px] px-2 sticky left-0 z-20 [&:is(th)]:bg-surface-contrast bg-surface-background lg:bg-surface-default",
          hasYear2 &&
            "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:content-[''] after:bg-border-default",
        ),
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
            <span className="text-table-header whitespace-nowrap">Budget</span>
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
          {hasYear2 && (
            <span className="text-table-header whitespace-nowrap font-normal">
              Stream Duration
            </span>
          )}
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
            {hasYear2 && (
              <span
                className={cn(
                  "text-xs",
                  // chart-1 = blue (multi-year), chart-2 = orange (single-year)
                  row.original.streamDuration >= 2
                    ? "text-[var(--base-chart-1)]"
                    : "text-[var(--base-chart-2)]",
                )}
              >
                {`${row.original.streamDuration} year${row.original.streamDuration > 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.original.budget - rowB.original.budget,
      meta: { columnClassName: "w-[152px]" },
    },
    ...year1Quarters.map((col) => buildQuarterColumn(col)),
    ...year2Quarters.map((col, i) => buildQuarterColumn(col, i)),
  ];

  return (
    <Table
      columns={columns}
      data={data}
      wrapperClassName="overflow-x-auto overflow-y-visible"
      withDownloadCSV={true}
      withSorting={true}
      mobileTableFixed
      fillHeight
    />
  );
};
