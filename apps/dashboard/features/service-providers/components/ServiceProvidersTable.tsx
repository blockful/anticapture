"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ProviderNameCell } from "@/features/service-providers/components/ProviderNameCell";
import { StatusCell } from "@/features/service-providers/components/StatusCell";
import {
  ENS_SERVICE_PROVIDERS,
  QUARTER_DUE_DATES,
  QUARTERS,
} from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterReport,
  type ServiceProvider,
} from "@/features/service-providers/types";
import { getCurrentQuarter } from "@/features/service-providers/utils/getQuarterInfos";
import { Button } from "@/shared/components";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { cn, formatNumberUserReadable } from "@/shared/utils";

interface ProviderRow {
  name: string;
  iconUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  Q1: QuarterReport;
  Q2: QuarterReport;
  Q3: QuarterReport;
  Q4: QuarterReport;
}

const SKELETON_ROW: ProviderRow = {
  name: "",
  budget: 0,
  Q1: { status: "upcoming" },
  Q2: { status: "upcoming" },
  Q3: { status: "upcoming" },
  Q4: { status: "upcoming" },
};

const SKELETON_ROWS: ProviderRow[] = Array.from(
  { length: ENS_SERVICE_PROVIDERS.length },
  () => SKELETON_ROW,
);

interface ServiceProvidersTableProps {
  providers: ServiceProvider[];
  year: number;
  isLoading?: boolean;
}

export const ServiceProvidersTable = ({
  providers,
  year,
  isLoading = false,
}: ServiceProvidersTableProps) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();
  const quarterMeta = QUARTER_DUE_DATES[year] ?? QUARTER_DUE_DATES[currentYear];

  const data: ProviderRow[] = isLoading
    ? SKELETON_ROWS
    : providers.flatMap((provider) => {
        const yearData = provider.years[year];
        if (!yearData) return [];
        return [
          {
            name: provider.name,
            iconUrl: provider.iconUrl,
            websiteUrl: provider.websiteUrl,
            proposalUrl: provider.proposalUrl,
            budget: provider.budget,
            Q1: yearData.Q1,
            Q2: yearData.Q2,
            Q3: yearData.Q3,
            Q4: yearData.Q4,
          },
        ];
      });

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
            iconUrl={row.original.iconUrl}
            websiteUrl={row.original.websiteUrl}
            proposalUrl={row.original.proposalUrl}
          />
        ),
      meta: { columnClassName: "w-[220px] px-2" },
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
          <span className="text-primary text-sm">
            {formatNumberUserReadable(row.original.budget)}
          </span>
        ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => rowA.original.budget - rowB.original.budget,
      meta: { columnClassName: "w-[92px]" },
    },
    ...QUARTERS.map((quarter) => {
      const isCurrentQuarter =
        year === currentYear && quarter === currentQuarter;
      const meta = quarterMeta[quarter];
      return {
        id: quarter,
        header: () => (
          <div
            className={cn(
              "flex h-full flex-col gap-0.5 px-2 py-1",
              isCurrentQuarter &&
                "bg-orange-400/12 border-1 border-surface-solid-brand",
            )}
          >
            <span className="text-primary text-xs font-medium">
              {quarter}
              {isCurrentQuarter && (
                <span className="text-secondary ml-1 font-normal">
                  (Current)
                </span>
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
              status={row.original[quarter].status}
              reportUrl={row.original[quarter].reportUrl}
            />
          ),
        meta: {
          columnClassName: "w-[149px] px-2",
        },
      } as ColumnDef<ProviderRow>;
    }),
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
