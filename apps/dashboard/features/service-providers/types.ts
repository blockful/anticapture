export type ReportStatus = "published" | "overdue" | "due_soon" | "upcoming";

export type QuarterReport = {
  status: ReportStatus;
  reportUrl?: string;
};

export type YearData = {
  Q1: QuarterReport;
  Q2: QuarterReport;
  Q3: QuarterReport;
  Q4: QuarterReport;
};

export type ServiceProvider = {
  name: string;
  avatarUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  githubSlug: string;
  years: Record<number, YearData>;
};

export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

export type QuarterMeta = {
  key: QuarterKey;
  label: string;
  dueDate: string;
  dueDateLabel: string;
};
