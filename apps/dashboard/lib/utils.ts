import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const BACKEND_ENDPOINT =
  "https://gov-indexer-backend-production.up.railway.app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
