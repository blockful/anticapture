"use client";

import {
  ColumnDef,
  flexRender,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  getSortedRowModel,
  useReactTable,
  TableOptions,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  isLoading: { [key: string]: boolean };
  filterColumn?: string;
  withSorting?: boolean;
  withPagination?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export const TheTable = <TData, TValue>({
  isLoading,
  withPagination = false,
  withSorting = false,
  filterColumn = "",
  columns,
  data,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  let tableConfig: TableOptions<TData> = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };

  if (withPagination) {
    tableConfig = {
      ...tableConfig,
      getPaginationRowModel: getPaginationRowModel(),
    };
  }

  if (withSorting) {
    tableConfig = {
      ...tableConfig,
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      state: { sorting },
    };
  }

  if (filterColumn) {
    tableConfig = {
      ...tableConfig,
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: { ...tableConfig.state, columnFilters },
    };
  }

  const table = useReactTable(tableConfig);

  const normalizeToCamelCase = (str: string) =>
    str
      .split(" ")
      .map((word, index) =>
        word === word.toUpperCase()
          ? word.toLowerCase()
          : index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join("");

  const SkeletonRow = ({ width = "w-32", height = "h-5" }) => {
    return (
      <div className={`flex animate-pulse justify-center space-x-2`}>
        <div className={`${width} ${height} rounded bg-gray-300`} />
      </div>
    );
  };

  return (
    <Table className="bg-dark text-foreground">
      <TableHeader className="text-sm font-medium text-foreground">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-lightDark">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            /* Normalize metric to camelCase because static metrics in the table are coming as lowercase keys during loading */
            const metric: string = row.getValue("metric");
            const normalizedKey = normalizeToCamelCase(metric);
            const isMetricLoading = isLoading[normalizedKey];
            return (
              <TableRow key={row.id} className="border-transparent">
                {row.getVisibleCells().map((cell) => {
                  const isAmountOrVariation =
                    cell.column.id === "currentValue" ||
                    cell.column.id === "variation";
                  return (
                    <TableCell key={cell.id}>
                      {isMetricLoading && isAmountOrVariation ? (
                        <SkeletonRow />
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-[530px] text-center"
            >
              {isLoading ? "Loading..." : "No results."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
