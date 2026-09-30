import type {
  QuarterKey,
  ReportStatus,
} from "@/features/service-providers/types";

const QUARTER_END_DATES: Record<QuarterKey, { month: number; day: number }> = {
  Q1: { month: 3, day: 31 },
  Q2: { month: 6, day: 30 },
  Q3: { month: 9, day: 30 },
  Q4: { month: 12, day: 31 },
};

// reportDueDays: days after the quarter ends that the program gives providers
// to publish the report (e.g. SPP3 Program Terms §6.3: 30 days).
export const getDueDate = (
  year: number,
  quarter: QuarterKey,
  reportDueDays = 0,
): Date => {
  const { month, day } = QUARTER_END_DATES[quarter];
  return new Date(Date.UTC(year, month - 1, day + reportDueDays, 23, 59, 59));
};

export const getDueDateLabel = (
  year: number,
  quarter: QuarterKey,
  reportDueDays = 0,
): string => {
  const dueDate = getDueDate(year, quarter, reportDueDays);
  const monthName = dueDate.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `Due by ${monthName} ${dueDate.getUTCDate()}`;
};

export const computeQuarterStatus = (
  year: number,
  quarter: QuarterKey,
  now: Date,
  reportDueDays = 0,
): ReportStatus => {
  const deadline = getDueDate(year, quarter, reportDueDays);

  if (now > deadline) return "overdue";

  const daysUntilDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline < 30) return "due_soon";

  return "upcoming";
};
