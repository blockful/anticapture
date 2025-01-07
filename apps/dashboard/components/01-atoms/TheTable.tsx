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
}

export const TheTable = <TData, TValue>({
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

  const SkeletonRow = ({ width = "w-32", height = "h-5" }) => {
    return (
      <div className={`flex animate-pulse justify-center space-x-2`}>
        <div className={`${width} ${height} rounded bg-gray-300`} />
      </div>
    );
  };

  return (
    <Table
      style={{
        borderRadius: "6px",
        borderColor: "var(--color-lightDark)",
        borderWidth: "1px",
        overflow: "hidden",
      }}
      className="border-lightDark bg-dark text-foreground"
    >
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
              <TableRow key={row.id} className="border-transparent">
                {row.getVisibleCells().map((cell) => {
                  const cellValue = cell.getValue();
                  const isCellLoading = cellValue === null;
                  return (
                    <TableCell key={cell.id}>
                      {isCellLoading ? (
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
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
