"use client";

import { ColumnDef } from "@tanstack/react-table";

import { ProviderNameCell } from "@/features/service-providers/components/ProviderNameCell";
import { StatusCell } from "@/features/service-providers/components/StatusCell";
import {
  QUARTER_DUE_DATES,
  QUARTERS,
} from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterReport,
  type ServiceProvider,
} from "@/features/service-providers/types";
import { getCurrentQuarter } from "@/features/service-providers/utils/getQuarterInfos";
import { Button } from "@/shared/components";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { cn, formatNumberUserReadable } from "@/shared/utils";

interface ProviderRow {
  name: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  Q1: QuarterReport;
  Q2: QuarterReport;
  Q3: QuarterReport;
  Q4: QuarterReport;
}

interface ServiceProvidersTableProps {
  providers: ServiceProvider[];
  year: number;
}

export const ServiceProvidersTable = ({
  providers,
  year,
}: ServiceProvidersTableProps) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();
  const quarterMeta = QUARTER_DUE_DATES[year] ?? QUARTER_DUE_DATES[currentYear];

  const data: ProviderRow[] = providers.flatMap((provider) => {
    const yearData = provider.years[year];
    if (!yearData) return [];
    return [
      {
        name: provider.name,
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
      cell: ({ row }) => (
        <ProviderNameCell
          name={row.original.name}
          websiteUrl={row.original.websiteUrl}
          proposalUrl={row.original.proposalUrl}
        />
      ),
      meta: { columnClassName: "w-[220px]" },
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
      cell: ({ row }) => (
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
              "flex h-full flex-col gap-0.5 pt-1",
              isCurrentQuarter && "border-b-2 border-orange-400",
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
            <span className="text-secondary text-[10px] font-normal">
              {meta?.dueDateLabel}
            </span>
          </div>
        ),
        cell: ({ row }: { row: { original: ProviderRow } }) => (
          <StatusCell
            status={row.original[quarter].status}
            reportUrl={row.original[quarter].reportUrl}
          />
        ),
        meta: {
          columnClassName: "w-[149px]",
        },
      } as ColumnDef<ProviderRow>;
    }),
  ];

  return (
    <Table
      columns={columns}
      data={data}
      onRowClick={() => {}}
      wrapperClassName="overflow-x-auto overflow-y-visible"
      withDownloadCSV={true}
      withSorting={true}
      fillHeight
    />
  );
};
