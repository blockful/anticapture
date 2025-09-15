"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  getSortedRowModel,
  useReactTable,
  TableOptions,
} from "@tanstack/react-table";
import {
  TableWrapper,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/design-system/table/components";
import { cn } from "@/shared/utils";

type ColumnMeta = {
  headerClassName?: string;
};

type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  meta?: ColumnMeta;
};

interface DataTableProps<TData, TValue> {
  filterColumn?: string;
  withSorting?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  onRowClick?: (row: TData) => void;
  disableRowClick?: (row: TData) => boolean;
  isTableSmall?: boolean;
  stickyFirstColumn?: boolean;
  mobileTableFixed?: boolean;
  showWhenEmpty?: ReactNode;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  infiniteRootMargin?: string;
}

export const Table = <TData, TValue>({
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
  enableInfiniteScroll = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  infiniteRootMargin = "0px 0px 200px 0px",
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore) return;
    if (!hasMore) return;

    const node = sentinelRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        root: wrapperRef.current,
        rootMargin: infiniteRootMargin,
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    enableInfiniteScroll,
    onLoadMore,
    hasMore,
    isLoadingMore,
    infiniteRootMargin,
  ]);

  let tableConfig: TableOptions<TData> = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };

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
    <TableWrapper
      className={cn(
        "text-secondary md:bg-surface-default border-separate border-spacing-0 bg-transparent",
        mobileTableFixed ? "table-fixed" : "table-auto md:table-fixed",
        className,
      )}
    >
      <TableHeader className="bg-surface-contrast text-secondary sticky top-0 z-30 text-xs font-semibold sm:font-medium">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className={cn("border-light-dark", isTableSmall && "border-b-4")}
          >
            {headerGroup.headers.map((header) => {
              const columnMeta = header.column.columnDef.meta as ColumnMeta;

              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    isTableSmall && "h-8",
                    header.column.getIndex() === 0 &&
                      stickyFirstColumn &&
                      "bg-surface-contrast sticky left-0 z-50",
                    columnMeta?.headerClassName,
                  )}
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
          <>
            {table.getRowModel().rows.map((row) => (
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
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {enableInfiniteScroll && (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <div
                    ref={sentinelRef}
                    className="text-secondary flex h-12 items-center justify-center text-xs"
                  >
                    {isLoadingMore
                      ? "Loading..."
                      : hasMore
                        ? "Load more..."
                        : "End of data"}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-full text-center">
              {showWhenEmpty || "No results."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </TableWrapper>
  );
};
