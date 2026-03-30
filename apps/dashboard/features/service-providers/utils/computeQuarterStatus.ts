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

export const getDueDate = (year: number, quarter: QuarterKey): Date => {
  const { month, day } = QUARTER_END_DATES[quarter];
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
};

export const getDueDateLabel = (quarter: QuarterKey): string => {
  const { month, day } = QUARTER_END_DATES[quarter];
  const monthName = new Date(2000, month - 1).toLocaleString("en-US", {
    month: "short",
  });
  return `Due by ${monthName} ${day}`;
};

export const computeQuarterStatus = (
  year: number,
  quarter: QuarterKey,
  now: Date,
): ReportStatus => {
  const deadline = getDueDate(year, quarter);

  if (now > deadline) return "overdue";

  const daysUntilDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline < 30) return "due_soon";

  return "upcoming";
};
