import { QuarterKey } from "@/features/service-providers/types";

export function getCurrentQuarter(): QuarterKey {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}
