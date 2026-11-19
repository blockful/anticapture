import type {
  ParsedQuarter,
  ProgramConfig,
  ProgramDefinition,
  ProviderEntry,
  ProvidersConfig,
  QuarterKey,
  QuarterReport,
  YearData,
} from "@/features/service-providers/types";
import { computeQuarterStatus } from "@/features/service-providers/utils/computeQuarterStatus";
import {
  fetchSppSource,
  type SppSource,
} from "@/features/service-providers/utils/fetchSppSource";
import { isHttpUrl } from "@/features/service-providers/utils/isHttpUrl";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export type ServiceProvidersData = Record<number, Record<string, YearData>>;

export type ServiceProvidersResult = {
  config: ProvidersConfig;
  programs: Record<string, ProgramDefinition>;
  // Keyed by program: the same quarter can have different deadlines per program.
  data: Record<string, ServiceProvidersData>;
  avatarUrls: Record<string, string>;
};

const parseQuarterString = (str: string): ParsedQuarter | null => {
  const match = str.match(/^(\d{4})\/(Q[1-4])$/);
  if (!match) return null;
  return { year: Number(match[1]), quarter: match[2] as QuarterKey };
};

export const parseProgramConfig = (
  config: ProgramConfig,
): ProgramDefinition => ({
  name: config.name,
  reportDueDays: config.reportDueDays ?? 0,
  discussionUrl: config.discussionUrl,
  budgetProposal: config.budgetProposal,
  selectionProposal: config.selectionProposal,
  year1Quarters: config.year1Quarters
    .map(parseQuarterString)
    .filter((q): q is ParsedQuarter => q !== null),
  year2Quarters: (config.year2Quarters ?? [])
    .map(parseQuarterString)
    .filter((q): q is ParsedQuarter => q !== null),
});

const collectYears = (program: ProgramDefinition): number[] => [
  ...new Set(
    [...program.year1Quarters, ...program.year2Quarters].map((q) => q.year),
  ),
];

const buildQuarterReport = (
  year: number,
  quarter: QuarterKey,
  reports: Record<string, string>,
  reportDueDays: number,
  now: Date,
): QuarterReport => {
  const reportUrl = reports[`${year}/${quarter}`];

  if (isHttpUrl(reportUrl)) {
    return { status: "published", reportUrl };
  }

  return { status: computeQuarterStatus(year, quarter, now, reportDueDays) };
};

export const buildProgramData = (
  program: ProgramDefinition,
  providers: ProviderEntry[],
  now: Date,
): ServiceProvidersData =>
  Object.fromEntries(
    collectYears(program).map((year) => [
      year,
      Object.fromEntries(
        providers.map((provider) => [
          provider.slug,
          Object.fromEntries(
            QUARTERS.map((quarter) => [
              quarter,
              buildQuarterReport(
                year,
                quarter,
                provider.reports,
                program.reportDueDays,
                now,
              ),
            ]),
          ) as YearData, // safe: maps over all 4 quarters
        ]),
      ),
    ]),
  );

export const SERVICE_PROVIDERS_API_PATH = "/api/service-providers";

/**
 * Reads the source files through this app's own server, which is reachable
 * wherever the dashboard is. If that route fails, falls back to reading GitHub
 * from the browser, which is what the page did before and still works on most
 * networks.
 */
export const fetchSource = async (
  fetchImpl: typeof fetch = fetch,
): Promise<SppSource> => {
  try {
    const response = await fetchImpl(SERVICE_PROVIDERS_API_PATH);
    if (!response.ok) {
      throw new Error(`${SERVICE_PROVIDERS_API_PATH}: ${response.status}`);
    }
    return (await response.json()) as SppSource;
  } catch {
    return fetchSppSource((url) => fetchImpl(url));
  }
};

export const fetchServiceProvidersData =
  async (): Promise<ServiceProvidersResult> => {
    const { config, programsConfig, avatarUrls } = await fetchSource();

    const programs = Object.fromEntries(
      Object.entries(programsConfig.programs).map(([key, value]) => [
        key,
        parseProgramConfig(value),
      ]),
    );

    const now = new Date();

    const data = Object.fromEntries(
      Object.entries(programs).map(([key, program]) => [
        key,
        buildProgramData(program, config.providers, now),
      ]),
    );

    return { config, programs, data, avatarUrls };
  };
