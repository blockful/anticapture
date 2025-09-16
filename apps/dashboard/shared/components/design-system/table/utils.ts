import type { Table, Column } from "@tanstack/react-table";

export interface CsvExportOptions {
  fileName?: string;
  separator?: string;
  includeBOM?: boolean;
  formatValue?: (value: unknown) => unknown;
}

type ColumnDefWithAccessorKey = { accessorKey: string };
type ColumnDefWithAccessorFn<TData> = {
  accessorFn: (originalRow: TData, index: number) => unknown;
};

const hasAccessorKey = (def: unknown): def is ColumnDefWithAccessorKey =>
  typeof def === "object" &&
  def !== null &&
  "accessorKey" in def &&
  typeof (def as { accessorKey?: unknown }).accessorKey === "string";

const hasAccessorFn = <TData>(
  def: unknown,
): def is ColumnDefWithAccessorFn<TData> =>
  typeof def === "object" &&
  def !== null &&
  "accessorFn" in def &&
  typeof (def as { accessorFn?: unknown }).accessorFn === "function";

const escapeCsvValue = (val: unknown): string => {
  if (val == null) return "";
  let s = String(val);
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const getHeaderLabel = <TData, TValue>(col: Column<TData, TValue>): string => {
  const def = col.columnDef;
  if (typeof def.header === "string") return def.header;
  if (hasAccessorKey(def)) return def.accessorKey;
  return col.id ?? "";
};

export const getCsvFromTableData = <TData>(
  data: TData[],
  table: Table<TData>,
  options: CsvExportOptions = {},
): void => {
  if (!table || !Array.isArray(data) || data.length === 0) return;

  const {
    fileName = `table-export-${new Date().toISOString()}.csv`,
    separator = ",",
    includeBOM = true,
    formatValue,
  } = options;

  const leafColumns = table
    .getAllLeafColumns()
    .filter(
      (c): c is Column<TData, unknown> =>
        hasAccessorKey(c.columnDef) || hasAccessorFn<TData>(c.columnDef),
    );

  if (leafColumns.length === 0) return;

  const headers = leafColumns.map((c) => getHeaderLabel(c));

  const rows: unknown[][] = data.map((row, rowIndex) =>
    leafColumns.map((col) => {
      const def = col.columnDef;
      try {
        if (hasAccessorKey(def)) {
          return (row as Record<string, unknown>)[def.accessorKey];
        }
        if (hasAccessorFn<TData>(def)) {
          return def.accessorFn(row, rowIndex);
        }
      } catch {
        return "";
      }
      return "";
    }),
  );

  const csvLines = [headers, ...rows].map((line) =>
    line
      .map((v) => escapeCsvValue(formatValue ? formatValue(v) : v))
      .join(separator),
  );

  const csvString = csvLines.join("\r\n") + "\r\n";

  const blobParts: string[] = [];
  if (includeBOM) blobParts.push("\uFEFF");
  blobParts.push(csvString);

  const blob = new Blob(blobParts, {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
