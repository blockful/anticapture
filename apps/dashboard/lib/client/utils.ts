import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toggleScreenScroll = () => {
  const body = document.getElementsByTagName("body")[0];

  if (body.classList.contains("no-scroll")) {
    body.classList.remove("no-scroll");
  } else {
    body.classList.add("no-scroll");
  }
};

export function sanitizeNumber(amount: number) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "Q" },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup.findLast((item) => amount >= item.value);
  return item
    ? (amount / item.value).toFixed(1).replace(regexp, "").concat(item.symbol)
    : "0";
}

export const RED_COLOR = "#FCA5A5";
export const GREEN_COLOR = "#5BB98B";

export function formatNumberUserReadable(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatBlocksToUserReadable(num: number): string {
  // Constants
  const SECONDS_PER_BLOCK = 12;

  // Handle zero or negative blocks
  if (num <= 0) return "0 sec";

  // Conversion table (in blocks)
  const units = [
    { value: 2628000, symbol: "year" },
    { value: 216000, symbol: "month" },
    { value: 50400, symbol: "week" },
    { value: 7200, symbol: "day" },
    { value: 300, symbol: "hour" },
    { value: 5, symbol: "min" },
  ];

  // For small block counts, just show seconds
  if (num < 5) {
    const seconds = Math.round(num * SECONDS_PER_BLOCK);
    return formatTimeUnit(seconds, "sec");
  }

  // Process larger time units
  let remaining = num;
  const parts = [];

  // Calculate each time unit
  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      remaining %= unit.value;
      parts.push(formatTimeUnit(count, unit.symbol));
    }
  }

  // Handle remaining minutes (if we have no parts yet)
  if (parts.length === 0 && remaining >= 5) {
    const minutes = Math.floor(remaining / 5);
    remaining %= 5;
    parts.push(formatTimeUnit(minutes, "min"));
  }

  // Handle remaining seconds
  if (remaining > 0) {
    const seconds = Math.round(remaining * SECONDS_PER_BLOCK);
    if (parts.length > 0 || seconds > 0) {
      parts.push(formatTimeUnit(seconds, "sec"));
    }
  }

  return parts.join(", ");
}

// Helper function to format a time unit with proper pluralization
export function formatTimeUnit(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : unit + "s"}`;
}

export const formatVariation = (rateRaw: string): string =>
  `${Number(Number(rateRaw) * 100).toFixed(2)}`;

export const timestampToReadableDate = (date: number) => {
  if (isNaN(date) || date === null || date === undefined) return "Invalid Date";

  const timestamp = date * 1000;
  const newDate = new Date(timestamp);

  if (isNaN(newDate.getTime())) return "Invalid Date";

  return newDate.toLocaleDateString("en-US");
};
