import {
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
} from "@/features/service-providers/constants/ens-service-providers";
import type {
  ParsedQuarter,
  ProgramConfig,
  ProgramDefinition,
  ProgramsConfig,
  ProvidersConfig,
  QuarterKey,
  QuarterReport,
  YearData,
} from "@/features/service-providers/types";
import { computeQuarterStatus } from "@/features/service-providers/utils/computeQuarterStatus";
import { isHttpUrl } from "@/features/service-providers/utils/isHttpUrl";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export type ServiceProvidersData = Record<number, Record<string, YearData>>;

export type ServiceProvidersResult = {
  config: ProvidersConfig;
  programs: Record<string, ProgramDefinition>;
  data: ServiceProvidersData;
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

const collectYears = (
  programs: Record<string, ProgramDefinition>,
): number[] => [
  ...new Set(
    Object.values(programs).flatMap((p) =>
      [...p.year1Quarters, ...p.year2Quarters].map((q) => q.year),
    ),
  ),
];

const buildQuarterReport = (
  year: number,
  quarter: QuarterKey,
  reports: Record<string, string>,
  now: Date,
): QuarterReport => {
  const reportUrl = reports[`${year}/${quarter}`];

  if (isHttpUrl(reportUrl)) {
    return { status: "published", reportUrl };
  }

  return { status: computeQuarterStatus(year, quarter, now) };
};

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${GITHUB_RAW_BASE}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
};

const fetchAvatarUrls = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/git/trees/main?recursive=1`,
    );
    if (!response.ok) return {};

    const { tree }: { tree: { path: string; type: string }[] } =
      await response.json();

    return Object.fromEntries(
      tree
        .filter(
          (item) =>
            item.type === "blob" && /^avatars\/[^/]+\.[^.]+$/.test(item.path),
        )
        .map((item) => {
          const fileName = item.path.slice("avatars/".length);
          const slug = fileName.slice(0, fileName.lastIndexOf("."));
          return [slug, `${GITHUB_RAW_BASE}/${item.path}`];
        }),
    );
  } catch {
    return {};
  }
};

export const fetchServiceProvidersData =
  async (): Promise<ServiceProvidersResult> => {
    const [config, programsConfig, avatarUrls] = await Promise.all([
      fetchJson<ProvidersConfig>("providers.json"),
      fetchJson<ProgramsConfig>("programs.json"),
      fetchAvatarUrls(),
    ]);

    const programs = Object.fromEntries(
      Object.entries(programsConfig.programs).map(([key, value]) => [
        key,
        parseProgramConfig(value),
      ]),
    );

    const years = collectYears(programs);
    const now = new Date();

    const data = Object.fromEntries(
      years.map((year) => [
        year,
        Object.fromEntries(
          config.providers.map((provider) => [
            provider.slug,
            Object.fromEntries(
              QUARTERS.map((quarter) => [
                quarter,
                buildQuarterReport(year, quarter, provider.reports, now),
              ]),
            ) as YearData, // safe: maps over all 4 quarters
          ]),
        ),
      ]),
    );

    return { config, programs, data, avatarUrls };
  };
