"use client";

import { ReactNode, useState } from "react";
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
  ExpandedState,
  getExpandedRowModel,
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
import { TreeLines } from "@/shared/components/tables/TreeLines";

interface DataTableProps<TData, TValue> {
  filterColumn?: string;
  withSorting?: boolean;
  withPagination?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  onRowClick?: (row: TData) => void;
  disableRowClick?: (row: TData) => boolean;
  isTableSmall?: boolean;
  stickyFirstColumn?: boolean;
  showWhenEmpty?: ReactNode;
  mobileTableFixed?: boolean;
  // Expandable functionality - optional props
  enableExpanding?: boolean;
  getSubRows?: (originalRow: TData, index: number) => TData[] | undefined;
  defaultExpanded?: ExpandedState;
  showParentDividers?: boolean;
}

export const TheTable = <TData, TValue>({
  withPagination = false,
  withSorting = false,
  filterColumn = "",
  columns,
  data,
  className,
  onRowClick,
  disableRowClick,
  isTableSmall = false,
  stickyFirstColumn = false,
  showWhenEmpty,
  mobileTableFixed = false,
  enableExpanding = false,
  getSubRows,
  defaultExpanded = {},
  showParentDividers = false,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(defaultExpanded);

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

  if (enableExpanding && getSubRows) {
    tableConfig = {
      ...tableConfig,
      state: { ...tableConfig.state, expanded },
      onExpandedChange: setExpanded,
      getSubRows,
      getExpandedRowModel: getExpandedRowModel(),
      paginateExpandedRows: false,
    };
  }

  const table = useReactTable(tableConfig);

  return (
    <Table
      className={cn(
        "text-secondary md:bg-surface-default border-separate border-spacing-0 bg-transparent",
        mobileTableFixed ? "table-fixed" : "table-auto md:table-fixed",
        className,
      )}
    >
      <TableHeader className="bg-surface-contrast text-secondary text-xs font-normal">
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
                      "bg-surface-contrast z-1 sticky left-0",
                  )}
                  style={{
                    width: header.column.getSize(),
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
      <TableBody className="h-max min-h-[400px]">
        {(table.getRowModel()?.rows?.length ?? 0 > 0) ? (
          table.getRowModel().rows.map((row, rowIndex) => {
            // Check if we need a divider before this row
            const needsDivider =
              showParentDividers && row.depth === 0 && rowIndex > 0;

            return (
              <TableRow
                key={row.id}
                className={cn(
                  "border-transparent transition-colors duration-300", // Highlight sub-rows
                  onRowClick && !disableRowClick?.(row.original)
                    ? "hover:bg-surface-contrast cursor-pointer"
                    : "cursor-default",
                  isTableSmall ? "h-10" : "h-13",
                  needsDivider && "border-border-default border-b",
                )}
                onClick={() =>
                  !disableRowClick?.(row.original) && onRowClick?.(row.original)
                }
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      cell.column.getIndex() === 0 &&
                        stickyFirstColumn &&
                        "bg-surface-default z-1 sticky left-0",
                    )}
                    style={{
                      width: cell.column.getSize(),
                    }}
                  >
                    <div className="flex items-center">
                      {/* Tree lines for hierarchical visualization */}
                      {index === 0 && enableExpanding && (
                        <TreeLines row={row} />
                      )}

                      {/* Cell content */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-full text-center">
              {showWhenEmpty || "No results."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
