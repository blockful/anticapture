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
import { ExpandButton } from "@/shared/components/tables/ExpandButton";

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
  mobileTableFixed?: boolean;
  showWhenEmpty?: ReactNode;
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
  mobileTableFixed = false,
  showWhenEmpty,
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
      <TableHeader className="bg-surface-contrast text-secondary text-xs font-medium font-normal">
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
      <TableBody className="min-h-[400px]">
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row, rowIndex) => {
            // Check if we need a divider before this row
            const needsDivider =
              showParentDividers &&
              row.depth === 0 &&
              rowIndex > 0 &&
              table.getRowModel().rows[rowIndex - 1]?.depth === 0;

            return (
              <>
                {/* Parent row divider */}
                {needsDivider && (
                  <tr key={`divider-${row.id}`}>
                    <td colSpan={columns.length} className="p-0">
                      <div className="border-border-default border-t" />
                    </td>
                  </tr>
                )}

                <TableRow
                  key={row.id}
                  className={cn(
                    "border-transparent transition-colors duration-300",
                    enableExpanding &&
                      row.depth > 0 &&
                      "bg-surface-contrast/50", // Highlight sub-rows
                    onRowClick && !disableRowClick?.(row.original)
                      ? "hover:bg-surface-contrast cursor-pointer"
                      : "cursor-default",
                    isTableSmall ? "h-10" : "h-13",
                  )}
                  onClick={() =>
                    !disableRowClick?.(row.original) &&
                    onRowClick?.(row.original)
                  }
                >
                  {row.getVisibleCells().map((cell, index) => (
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
                      <div className="flex items-center">
                        {/* Tree lines for hierarchical visualization */}
                        {index === 0 && enableExpanding && (
                          <TreeLines row={row} />
                        )}

                        {/* Expand/Collapse button */}
                        {index === 0 && (
                          <div className="flex items-center px-1">
                            <ExpandButton
                              row={row}
                              enableExpanding={enableExpanding}
                            />
                          </div>
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
              </>
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
