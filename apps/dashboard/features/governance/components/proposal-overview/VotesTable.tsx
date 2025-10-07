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
  hideExpandButtons?: boolean;
}

export const VotesTable = <TData, TValue>({
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
  hideExpandButtons = false,
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
    <div className="h-[500px] overflow-scroll">
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
        <TableBody className="h-max min-h-[400px]">
          {(() => {
            // Use expanded row model if expanding is enabled, otherwise use regular row model
            const rows =
              enableExpanding && getSubRows
                ? table.getExpandedRowModel().rows
                : table.getRowModel().rows;

            return rows.length > 0 ? (
              rows.map((row, rowIndex) => {
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
                      // Use dynamic height for description rows, fixed height for others
                      (row.original as { isSubRow?: boolean })?.isSubRow
                        ? "h-auto min-h-10"
                        : isTableSmall
                          ? "h-10"
                          : "h-13",
                      needsDivider && "border-border-default border-b",
                    )}
                    onClick={() =>
                      !disableRowClick?.(row.original) &&
                      onRowClick?.(row.original)
                    }
                  >
                    {(() => {
                      const rowData = row.original as {
                        isSubRow?: boolean;
                        reason?: string;
                      };

                      // Handle description sub-rows - render as single cell spanning all columns
                      if (rowData.isSubRow && rowData.reason) {
                        return (
                          <TableCell colSpan={columns.length} className="p-0">
                            <div className="bg-surface-contrast/20 flex h-auto min-h-10 items-start gap-3 p-2 pl-8">
                              <div className="w-full flex-col">
                                <span className="text-secondary whitespace-pre-wrap break-words font-sans text-[14px] font-normal leading-[20px]">
                                  {rowData.reason}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        );
                      }

                      // Regular row rendering
                      return row.getVisibleCells().map((cell, index) => (
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

                            {/* Expand/Collapse button */}
                            {index === 0 && !hideExpandButtons && (
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
                      ));
                    })()}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-full text-center"
                >
                  {showWhenEmpty || "No results."}
                </TableCell>
              </TableRow>
            );
          })()}
        </TableBody>
      </Table>
    </div>
  );
};
