export type ReportStatus =
  | "published"
  | "overdue"
  | "due_soon"
  | "upcoming"
  | "1y_only";

export type SPPKey = "SPP1" | "SPP2";

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
  sppPrograms: SPPKey[];
  streamDuration: 1 | 2;
  years: Record<number, YearData>;
};

export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

export type QuarterMeta = {
  key: QuarterKey;
  label: string;
  dueDate: string;
  dueDateLabel: string;
};
