import { QUARTER_DUE_DATES } from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterKey,
  type ReportStatus,
} from "@/features/service-providers/types";

export const computeQuarterStatus = (
  year: number,
  quarter: QuarterKey,
  now: Date,
): ReportStatus => {
  const dueDateStr = QUARTER_DUE_DATES[year]?.[quarter]?.dueDate;
  if (!dueDateStr) return "upcoming";

  // Treat deadline as end of day UTC
  const deadline = new Date(`${dueDateStr}T23:59:59Z`);

  if (now > deadline) return "overdue";

  const daysUntilDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline < 30) return "due_soon";

  return "upcoming";
};
