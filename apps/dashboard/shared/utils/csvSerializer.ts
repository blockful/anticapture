import { isValidElement } from "react";

const escapeCsv = (value: string) => value.replace(/"/g, '""');

export const serializeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  if (isValidElement(value)) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return escapeCsv(String(value));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return escapeCsv(value.map((item) => String(item)).join(", "));
  }

  if (typeof value === "object") {
    if (
      "text" in value &&
      typeof (value as Record<string, unknown>).text === "string"
    ) {
      return escapeCsv((value as Record<string, unknown>).text as string);
    }
  }

  return "";
};

export const flattenRow = (
  row: Record<string, unknown>,
  prefix = "",
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    const csvKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      result[csvKey] = "";
      continue;
    }

    if (isValidElement(value)) continue;

    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      const obj = value as Record<string, unknown>;

      if ("text" in obj && "icon" in obj) {
        result[csvKey] = escapeCsv(String(obj.text ?? ""));
        continue;
      }

      const nested = flattenRow(obj, csvKey);
      Object.assign(result, nested);
      continue;
    }

    const serialized = serializeCsvValue(value);
    result[csvKey] = /[",\n]/.test(serialized) ? `"${serialized}"` : serialized;
  }

  return result;
};

export const formatCsvData = <TData>(
  data: TData[],
): Record<string, string>[] => {
  const flatRows = data.map((row) =>
    flattenRow(row as Record<string, unknown>),
  );

  // Collect all keys across all rows to ensure consistent columns
  const allKeys = new Set<string>();
  for (const row of flatRows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  // Ensure every row has every key (react-csv requires consistent keys)
  const keys = Array.from(allKeys);
  return flatRows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const key of keys) {
      normalized[key] = row[key] ?? "";
    }
    return normalized;
  });
};
