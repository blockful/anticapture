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
import { getCsvFromTableData } from "@/shared/components/design-system/table/utils";
import { DownloadIcon } from "lucide-react";
import { sizeVariants } from "@/shared/components/design-system/table/styles";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";

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
  wrapperClassName?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  disableRowClick?: (row: TData) => boolean;
  stickyFirstColumn?: boolean;
  mobileTableFixed?: boolean;
  customEmptyState?: ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  infiniteRootMargin?: string;
  size?: "default" | "sm";
}

export const Table = <TData, TValue>({
  withSorting = false,
  filterColumn = "",
  columns,
  data,
  className,
  onRowClick,
  disableRowClick,
  stickyFirstColumn = false,
  mobileTableFixed = false,
  customEmptyState,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  infiniteRootMargin = "0px 0px 200px 0px",
  wrapperClassName,
  size = "default",
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onLoadMore) return;
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
  }, [onLoadMore, hasMore, isLoadingMore, infiniteRootMargin]);

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

  const handleExportCSV = () => {
    if (!data.length) return;

    getCsvFromTableData(data, table);
  };

  return (
    <div className={cn("flex w-full flex-col", wrapperClassName)}>
      <TableWrapper
        className={cn(
          "text-secondary md:bg-surface-default border-separate border-spacing-0 bg-transparent",
          mobileTableFixed ? "table-fixed" : "table-auto md:table-fixed",
          className,
        )}
      >
        <TableHeader className="bg-surface-contrast text-secondary sticky top-0 z-30 text-xs font-semibold sm:font-medium">
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
                      sizeVariants[size],
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
                    !disableRowClick?.(row.original) &&
                    onRowClick?.(row.original)
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
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
                className="h-full text-center"
              >
                {customEmptyState || <EmptyState />}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableWrapper>
      <p className="text-secondary mt-2 flex font-mono text-xs tracking-wider">
        [DOWNLOAD AS{" "}
        <button
          onClick={handleExportCSV}
          className="text-link hover:text-link-hover ml-2 flex cursor-pointer items-center gap-1"
        >
          CSV <DownloadIcon className="size-3.5" />
        </button>
        ]
      </p>
    </div>
  );
};
