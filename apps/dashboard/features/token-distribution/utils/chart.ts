import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { formatUnits } from "viem";

// Timestamp utility functions
export const normalizeTimestamp = (timestamp: number | string): number => {
  const ts = Number(timestamp);
  // Convert milliseconds to seconds if needed
  return ts > 1000000000000 ? Math.floor(ts / 1000) : ts;
};

export const validateChartData = <T extends Record<string, unknown>>(
  data: T[],
  requiredKeys: string[],
): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.every(
    (item) =>
      item &&
      typeof item === "object" &&
      requiredKeys.every((key) => key in item),
  );
};


export const calculateChangeRate = (
  data: DaoMetricsDayBucket[] = [],
): string | null => {
  if (data.length < 2) return null;

  const first = data[0].high;
  const last = data.at(-1)?.high;

  if (!first || !last || BigInt(first) === BigInt(0)) return "0";

  const change = (BigInt(last) * BigInt(1e18)) / BigInt(first) - BigInt(1e18);
  return formatUnits(change, 18);
};

