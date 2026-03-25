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

// --- External providers.json schema (spp-accountability repo) ---

export type ProgramConfig = {
  quarters?: string[];
  year1Quarters?: string[];
  year2Quarters?: string[];
};

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
};

export type ProvidersConfig = {
  programs: Record<string, ProgramConfig>;
  providers: ProviderEntry[];
};

// --- Dashboard runtime types ---

export type ParsedQuarter = { year: number; quarter: QuarterKey };

export type ProgramDefinition = {
  year1Quarters: ParsedQuarter[];
  year2Quarters: ParsedQuarter[];
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
