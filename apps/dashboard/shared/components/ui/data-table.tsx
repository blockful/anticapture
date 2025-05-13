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
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import React, { useState } from "react";

interface DataTableProps<TData, TValue> {
  title?: string;
  icon: null | JSX.Element;
  isLoading: boolean;
  filterColumn?: string;
  withSorting?: boolean;
  withPagination?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  isLoading,
  title = "",
  icon = null,
  withPagination = false,
  withSorting = false,
  filterColumn = "",
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

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
      state: {
        sorting,
      },
    };
  }

  if (filterColumn) {
    tableConfig = {
      ...tableConfig,
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        ...tableConfig.state,
        columnFilters,
      },
    };
  }

  const table = useReactTable(tableConfig);

  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);

  return (
    <div className="w-full rounded-md border border-lightDark p-4 text-foreground">
      <div className="mb-4 flex items-center justify-between space-x-4">
        <div className="flex space-x-3">
          {icon}
          <h3 className="font-medium text-white">{title}</h3>
        </div>
        <Input
          placeholder="Filter by ENS name or ETH address..."
          value={
            (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
          }
          onChange={(event: any) =>
            table.getColumn(filterColumn)?.setFilterValue(event.target.value)
          }
          className="max-w-sm border-lightDark bg-dark placeholder:text-middleDark"
        />
      </div>
      <Table className="bg-dark text-foreground">
        <TableHeader className="text-sm font-medium text-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-lightDark">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-lightDark"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
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

          {/* Below we render blank rows for completing 10 rows per page */}
          {table.getRowModel().rows.length &&
          table.getRowModel().rows.length < 10
            ? Array(10 - table.getRowModel().rows.length)
                .fill(0)
                .map((idx) => (
                  <TableRow key={idx} className="border border-lightDark">
                    <TableCell
                      colSpan={columns.length}
                      className="text-center"
                    ></TableCell>
                  </TableRow>
                ))
            : null}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between space-x-2 py-4 pr-4">
        {table.getPageCount() ? (
          <p>
            {currentPageNumber} / {table.getPageCount()}
          </p>
        ) : (
          <div></div>
        )}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPageNumber(currentPageNumber - 1);
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPageNumber(currentPageNumber + 1);
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
