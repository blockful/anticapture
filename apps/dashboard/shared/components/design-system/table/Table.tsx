"use client";

import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  getSortedRowModel,
  getExpandedRowModel,
  ExpandedState,
  useReactTable,
  TableOptions,
  Row,
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
import { DownloadIcon, Inbox } from "lucide-react";
import {
  headerSizeVariants,
  rowSizeVariants,
} from "@/shared/components/design-system/table/styles";
import { TreeLines } from "@/shared/components/tables/TreeLines";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { CSVLink } from "react-csv";
import { defaultLinkVariants } from "@/shared/components/design-system/links/default-link";
import {
  ExpandableData,
  ExpandButton,
} from "@/shared/components/design-system/table/ExpandButton";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  href?: (row: TData) => string | null | undefined;
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
  enableExpanding?: boolean;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (row: Row<TData>) => ReactNode;
  getSubRows?: (originalRow: TData, index: number) => TData[] | undefined;
  error?: Error | null;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const Table = <TData, TValue>({
  className,
  columns,
  customEmptyState,
  data,
  disableRowClick,
  filterColumn = "",
  hasMore = false,
  href,
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
  enableExpanding = false,
  getRowCanExpand,
  renderSubComponent,
  getSubRows,
  error,
  emptyTitle = "Nothing to show yet",
  emptyDescription = "No relevant governance signals were detected for this selection.",
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const router = useRouter();

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

  if (enableExpanding) {
    state = { ...state, expanded };
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
    ...(enableExpanding && {
      getExpandedRowModel: getExpandedRowModel(),
      onExpandedChange: setExpanded,
      ...(getRowCanExpand && { getRowCanExpand }),
      ...(getSubRows && { getSubRows }),
    }),
  };

  const table = useReactTable(tableConfig);

  const escapeCsv = (value: string) => value.replace(/"/g, '""');

  const serializeValue = (value: unknown): string => {
    const primitiveTypes = new Set(["string", "number", "boolean"]);

    if (!value) return "";

    if (primitiveTypes.has(typeof value)) {
      return escapeCsv(String(value));
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    try {
      return escapeCsv(JSON.stringify(value));
    } catch {
      return "";
    }
  };

  const formatCsvData = (data: TData[]): Record<string, string>[] => {
    return data.map((row) =>
      Object.entries(row as Record<string, unknown>).reduce<
        Record<string, string>
      >((acc, [key, value]) => {
        const serialized = serializeValue(value);
        acc[key] = /[",\n]/.test(serialized) ? `"${serialized}"` : serialized;
        return acc;
      }, {}),
    );
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
        <TableHeader className="bg-surface-contrast text-secondary sticky -top-px z-30 text-xs font-medium">
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
                        "bg-surface-contrast sticky-border-r sticky left-0 z-20 md:relative",
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
              {table.getRowModel().rows.map((row) => {
                const isLastNestedRow =
                  row.getParentRow()?.getLeafRows().slice(-1)[0].id === row.id;

                const rowHref = href ? href(row.original) : null;

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group border-transparent transition-colors duration-300",
                        (onRowClick || rowHref) &&
                          !disableRowClick?.(row.original)
                          ? "hover:bg-surface-contrast cursor-pointer"
                          : "cursor-default",
                        enableExpanding &&
                          row.depth === 0 &&
                          "border-light-dark",
                        row.getIsExpanded() && "border-b-transparent",
                        isLastNestedRow && "border-b-light-dark",
                      )}
                      onClick={(e) => {
                        // Don't handle click if it came from a Link inside
                        if ((e.target as HTMLElement).closest("a")) return;
                        if (disableRowClick?.(row.original)) return;
                        if (onRowClick) {
                          onRowClick(row.original);
                        } else if (rowHref) {
                          router.push(rowHref);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell, index) => {
                        const colMeta = (
                          cell.column.columnDef as { meta?: ColumnMeta }
                        ).meta;
                        const cellContent = (
                          <div className="flex w-full items-center gap-2">
                            {index === 0 && enableExpanding && (
                              <TreeLines row={row} />
                            )}
                            {index === 0 && (
                              <ExpandButton
                                row={row as unknown as Row<ExpandableData>}
                                enableExpanding={enableExpanding}
                              />
                            )}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        );

                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              cell.column.getIndex() === 0 &&
                                stickyFirstColumn &&
                                "bg-surface-background sticky-border-r sm:bg-surface-default sticky left-0 z-20 shadow-md shadow-black md:relative md:bg-transparent",
                              rowSizeVariants[size],
                              colMeta?.columnClassName,
                            )}
                          >
                            {/* Wrap cell content with Link for prefetching and URL display - maintains valid HTML */}
                            {rowHref && !disableRowClick?.(row.original) ? (
                              <Link
                                href={rowHref}
                                prefetch={true}
                                className="flex h-full w-full items-center justify-start"
                                onClick={(e) => {
                                  // Let Link handle navigation naturally
                                  e.stopPropagation();
                                }}
                              >
                                {cellContent}
                              </Link>
                            ) : (
                              cellContent
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="bg-surface-contrast p-0"
                        >
                          {renderSubComponent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}

              <div ref={sentinelRef} />

              {isLoadingMore && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <div className="text-link flex h-12 items-center justify-center font-mono text-xs tracking-wider">
                      LOADING...
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ) : (
            <TableCell
              colSpan={columns.length}
              className={cn("text-center", className)}
            >
              {" "}
              {customEmptyState ? (
                customEmptyState
              ) : error ? (
                <EmptyState />
              ) : (
                data.length === 0 && (
                  <EmptyState
                    icon={<Inbox />}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                )
              )}
            </TableCell>
          )}
        </TableBody>
      </TableContainer>
      {withDownloadCSV && data.length > 0 && (
        <p className="text-secondary mt-2 flex font-mono text-[13px] tracking-wider">
          [DOWNLOAD AS{" "}
          <CSVLink
            data={formatCsvData(data)}
            filename={"table-data.csv"}
            className={cn(
              defaultLinkVariants({ variant: "highlight" }),
              "pl-2",
            )}
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
