export type ReportStatus = "published" | "overdue" | "due_soon" | "upcoming";

export interface QuarterReport {
  status: ReportStatus;
  reportUrl?: string;
}

export interface YearData {
  Q1: QuarterReport;
  Q2: QuarterReport;
  Q3: QuarterReport;
  Q4: QuarterReport;
}

export interface ServiceProvider {
  name: string;
  websiteUrl: string;
  proposalUrl?: string;
  budget: string;
  githubSlug: string;
  years: Record<number, YearData>;
}

export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterMeta {
  key: QuarterKey;
  label: string;
  dueDate: string;
  dueDateLabel: string;
}

export const QUARTER_DUE_DATES: Record<
  number,
  Record<QuarterKey, { dueDate: string; dueDateLabel: string }>
> = {
  2025: {
    Q1: { dueDate: "2025-03-31", dueDateLabel: "Due by Mar 31" },
    Q2: { dueDate: "2025-06-30", dueDateLabel: "Due by Jun 30" },
    Q3: { dueDate: "2025-09-30", dueDateLabel: "Due by Sep 30" },
    Q4: { dueDate: "2025-12-31", dueDateLabel: "Due by Dec 31" },
  },
  2026: {
    Q1: { dueDate: "2026-03-31", dueDateLabel: "Due by Mar 31" },
    Q2: { dueDate: "2026-06-30", dueDateLabel: "Due by Jun 30" },
    Q3: { dueDate: "2026-09-30", dueDateLabel: "Due by Sep 30" },
    Q4: { dueDate: "2026-12-31", dueDateLabel: "Due by Dec 31" },
  },
};

export function getCurrentQuarter(): QuarterKey {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}
