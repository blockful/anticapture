export type ReportStatus =
  | "published"
  | "overdue"
  | "due_soon"
  | "upcoming"
  | "1y_only";

export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

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

// --- External JSON schema (spp-accountability repo) ---

export type ProgramProposal = {
  id: string;
  title: string;
  type: "social" | "executable";
  description?: string;
  date: string;
  forumUrl: string;
  snapshotUrl?: string;
  tallyUrl?: string;
  docsUrl?: string;
};

export type ProgramConfig = {
  name: string;
  year1Quarters: string[];
  year2Quarters?: string[];
  budget: number;
  startDate: string;
  proposals: ProgramProposal[];
};

export type ProgramsConfig = Record<string, ProgramConfig>;

export type ProviderProgramEntry = {
  proposalUrl?: string;
  budget: number;
  streamDuration?: 1 | 2;
};

export type ProviderEntry = {
  name: string;
  slug: string;
  website?: string;
  programs: Record<string, ProviderProgramEntry>;
  reports: Record<string, string>;
};

export type ProvidersConfig = {
  providers: ProviderEntry[];
};

// --- Dashboard runtime types ---

export type ParsedQuarter = { year: number; quarter: QuarterKey };

export type ProgramDefinition = {
  name: string;
  year1Quarters: ParsedQuarter[];
  year2Quarters: ParsedQuarter[];
  proposals: ProgramProposal[];
};

export type ServiceProvider = {
  name: string;
  avatarUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
  budget: number;
  githubSlug: string;
  streamDuration: 1 | 2;
  years: Record<number, YearData>;
};
