import * as React from "react";

import { cn } from "@/shared/utils/";

function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="md:border-light-dark relative w-full overflow-auto md:rounded-lg md:border">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-surface-contrast font-medium [&_th:first-child]:border-r [&_th:first-child]:border-white/10 md:[&_th]:border-none [&_tr]:border-b",
        // "[&_th:first-child]:shadow-[2px_0px_8px_2px_rgba(0,0,0,1.00)] sm:[&_th:first-child]:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("scrollbar-none [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-accent border-t font-medium last:[&>tr]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-accent data-[state=selected]:bg-muted [&_td]:border-b-light-dark transition-colors [&_td:first-child]:border-r [&_td:first-child]:border-r-white/10 md:[&_td:first-child]:border-r-0 [&_td]:border-b",
        // "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10",
        // "[&_td:first-child]:shadow-[2px_0px_8px_2px_rgba(0,0,0,1.00)] sm:[&_td:first-child]:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 text-left font-normal [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td data-slot="table-cell" className={cn("p-0", className)} {...props} />
  );
}

function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-accent mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
