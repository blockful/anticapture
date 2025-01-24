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

export function formatNumberUserReadble(num: number): string {
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

export function formatTimestampUserReadable(num: number): string {
  const timestamp = [
    { value: 1, symbol: "sec" },
    { value: 60, symbol: "min" },
    { value: 3600, symbol: "hour" },
    { value: 86400, symbol: "day" },
    { value: 604800, symbol: "week" },
    { value: 2592000, symbol: "month" },
    { value: 31536000, symbol: "year" },
  ];

  const matchedUnit = timestamp
    .slice()
    .reverse()
    .find((item) => num >= item.value);

  if (matchedUnit) {
    const value = (num / matchedUnit.value).toFixed(1).replace(/\.0$/, "");
    return `${value} ${matchedUnit.symbol}`;
  }

  return "0 sec";
}

export const formatVariation = (rateRaw: string): string =>
  `${Number(Number(rateRaw) * 100).toFixed(2)}`;
