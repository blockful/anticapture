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
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/design-system/table/components";
import { cn } from "@/shared/utils";
import { DownloadIcon } from "lucide-react";
import {
  headerSizeVariants,
  rowSizeVariants,
} from "@/shared/components/design-system/table/styles";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { CSVLink } from "react-csv";

type ColumnMeta = {
  columnClassName?: string;
};

type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  meta?: ColumnMeta;
};

interface DataTableProps<TData, TValue> {
  className?: string;
  columns: ColumnDef<TData, TValue>[];
  customEmptyState?: ReactNode;
  data: TData[];
  disableRowClick?: (row: TData) => boolean;
  filterColumn?: string;
  hasMore?: boolean;
  infiniteRootMargin?: string;
  isLoadingMore?: boolean;
  mobileTableFixed?: boolean;
  onLoadMore?: () => void;
  onRowClick?: (row: TData) => void;
  size?: "default" | "sm";
  stickyFirstColumn?: boolean;
  withDownloadCSV?: boolean;
  withSorting?: boolean;
  wrapperClassName?: string;
}

export const Table = <TData, TValue>({
  className,
  columns,
  customEmptyState,
  data,
  disableRowClick,
  filterColumn = "",
  hasMore = false,
  infiniteRootMargin = "0px 0px 200px 0px",
  isLoadingMore = false,
  mobileTableFixed = false,
  onLoadMore,
  onRowClick,
  size = "default",
  stickyFirstColumn = false,
  withDownloadCSV = false,
  withSorting = false,
  wrapperClassName,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const node = sentinelRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) onLoadMore();
      },
      {
        root: wrapperRef.current,
        rootMargin: infiniteRootMargin,
        threshold: 0,
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore, infiniteRootMargin]);

  let state: TableOptions<TData>["state"] = {};

  if (withSorting) {
    state = { ...state, sorting };
  }

  if (filterColumn) {
    state = { ...state, columnFilters };
  }

  const tableConfig: TableOptions<TData> = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state,
    ...(withSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(filterColumn && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
    }),
  };

  const table = useReactTable(tableConfig);

  const formatCsvData = (data: TData[]): object[] => {
    return data.map((row) => {
      const serialized: Record<string, string | number | null> = {};
      Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          serialized[key] = "";
        } else if (typeof value === "object") {
          const json = JSON.stringify(value).replace(/"/g, '""');
          serialized[key] = `"${json}"`;
        } else {
          serialized[key] = value as string | number;
        }
      });
      return serialized;
    });
  };

  return (
    <div
      className={cn("flex w-full flex-col", wrapperClassName)}
      ref={wrapperRef}
    >
      <TableContainer
        className={cn(
          "text-secondary md:bg-surface-default border-separate border-spacing-0 bg-transparent",
          mobileTableFixed ? "table-fixed" : "table-auto md:table-fixed",
        )}
      >
        <TableHeader className="bg-surface-contrast text-secondary sticky -top-px z-30 text-xs font-semibold sm:font-medium">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={"border-light-dark"}>
              {headerGroup.headers.map((header) => {
                const columnMeta = header.column.columnDef.meta as ColumnMeta;

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getIndex() === 0 &&
                        stickyFirstColumn &&
                        "bg-surface-contrast sticky left-0 z-50",
                      headerSizeVariants[size],
                      columnMeta?.columnClassName,
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
        <TableBody className={className}>
          {table.getRowModel().rows.length > 0 ? (
            <>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-transparent transition-colors duration-300",
                    onRowClick && !disableRowClick?.(row.original)
                      ? "hover:bg-surface-contrast cursor-pointer"
                      : "cursor-default",
                  )}
                  onClick={() =>
                    !disableRowClick?.(row.original) &&
                    onRowClick?.(row.original)
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const colMeta = (
                      cell.column.columnDef as { meta?: ColumnMeta }
                    ).meta;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.getIndex() === 0 &&
                            stickyFirstColumn &&
                            "bg-surface-default sticky left-0 z-50",
                          rowSizeVariants[size],
                          colMeta?.columnClassName,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              <div ref={sentinelRef} aria-hidden="true" />

              {isLoadingMore && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <div className="text-link flex h-12 items-center justify-center text-xs tracking-wider">
                      LOADING...
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn("text-center", className)}
              >
                {customEmptyState || <EmptyState />}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>
      {withDownloadCSV && (
        <p className="text-secondary mt-2 flex font-mono text-xs tracking-wider">
          [DOWNLOAD AS{" "}
          <CSVLink
            data={formatCsvData(data)}
            filename={"table-data.csv"}
            className="text-link hover:text-link-hover ml-2 flex cursor-pointer items-center gap-1"
            separator=";"
          >
            CSV <DownloadIcon className="size-3.5" />
          </CSVLink>
          ]
        </p>
      )}
    </div>
  );
};
