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
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  filterColumn?: string;
  withSorting?: boolean;
  withPagination?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  disableRowClick?: (row: TData) => boolean;
}

export const TheTable = <TData, TValue>({
  withPagination = false,
  withSorting = false,
  filterColumn = "",
  columns,
  data,
  onRowClick,
  disableRowClick,
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
    <Table className="table-auto bg-dark text-foreground lg:table-fixed">
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
            return (
              <TableRow
                key={row.id}
                className={`border-transparent ${onRowClick && !disableRowClick?.(row.original) ? "cursor-pointer hover:bg-lightDark" : ""}`}
                onClick={() =>
                  !disableRowClick?.(row.original) && onRowClick?.(row.original)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
