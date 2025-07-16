"use client";

import { useState } from "react";
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
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils";

interface DataTableProps<TData, TValue> {
  filterColumn?: string;
  withSorting?: boolean;
  withPagination?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  disableRowClick?: (row: TData) => boolean;
  isTableSmall?: boolean;
  stickyFirstColumn?: boolean;
  mobileTableFixed?: boolean;
}

export const TheTable = <TData, TValue>({
  withPagination = false,
  withSorting = false,
  filterColumn = "",
  columns,
  data,
  onRowClick,
  disableRowClick,
  isTableSmall = false,
  stickyFirstColumn = false,
  mobileTableFixed = false,
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

  return (
    <Table
      className={cn(
        "text-secondary md:bg-surface-default border-separate border-spacing-0 bg-transparent",
        mobileTableFixed ? "table-fixed" : "table-auto md:table-fixed",
      )}
    >
      <TableHeader className="bg-surface-contrast text-secondary text-xs font-semibold sm:font-medium">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className={cn("border-light-dark", isTableSmall && "border-b-4")}
          >
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    isTableSmall && "h-8",
                    header.column.getIndex() === 0 &&
                      stickyFirstColumn &&
                      "bg-surface-contrast sticky left-0 z-50",
                  )}
                  style={{
                    width:
                      header.column.getSize() !== 150
                        ? header.column.getSize()
                        : "auto",
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            return (
              <TableRow
                key={row.id}
                className={`border-transparent transition-colors duration-300 ${onRowClick && !disableRowClick?.(row.original) ? "hover:bg-surface-contrast cursor-pointer" : "cursor-default"}`}
                onClick={() =>
                  !disableRowClick?.(row.original) && onRowClick?.(row.original)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      cell.column.getIndex() === 0 &&
                        stickyFirstColumn &&
                        "bg-surface-default sticky left-0 z-50",
                    )}
                    style={{
                      width: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-[530px] text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
