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

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

export type ServiceProvidersData = Record<number, Record<string, YearData>>;

export type ServiceProvidersResult = {
  config: ProvidersConfig;
  programs: Record<string, ProgramDefinition>;
  data: ServiceProvidersData;
  avatarUrls: Record<string, string>;
};

function parseQuarterString(str: string): ParsedQuarter | null {
  const match = str.match(/^(\d{4})\/(Q[1-4])$/);
  if (!match) return null;
  return { year: Number(match[1]), quarter: match[2] as QuarterKey };
}

export function parseProgramConfig(config: ProgramConfig): ProgramDefinition {
  return {
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
  };
}

function collectYears(programs: Record<string, ProgramDefinition>): number[] {
  const years = new Set<number>();
  for (const program of Object.values(programs)) {
    for (const q of [...program.year1Quarters, ...program.year2Quarters]) {
      years.add(q.year);
    }
  }
  return [...years].sort();
}

function buildQuarterReport(
  year: number,
  quarter: QuarterKey,
  reports: Record<string, string>,
  now: Date,
): QuarterReport {
  const key = `${year}/${quarter}`;
  const reportUrl = reports[key];

  if (reportUrl) {
    return { status: "published", reportUrl };
  }

  return { status: computeQuarterStatus(year, quarter, now) };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAvatarUrls(): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/git/trees/main?recursive=1`,
    );
    if (!response.ok) return {};

    const { tree }: { tree: { path: string; type: string }[] } =
      await response.json();

    const avatarUrls: Record<string, string> = {};
    tree
      .filter(
        (item) =>
          item.type === "blob" && /^avatars\/[^/]+\.[^.]+$/.test(item.path),
      )
      .forEach((item) => {
        const fileName = item.path.slice("avatars/".length);
        const slug = fileName.slice(0, fileName.lastIndexOf("."));
        avatarUrls[slug] = `${GITHUB_RAW_BASE}/${item.path}`;
      });

    return avatarUrls;
  } catch {
    return {};
  }
}

export const fetchServiceProvidersData =
  async (): Promise<ServiceProvidersResult | null> => {
    const [config, programsConfig, avatarUrls] = await Promise.all([
      fetchJson<ProvidersConfig>("providers.json"),
      fetchJson<ProgramsConfig>("programs.json"),
      fetchAvatarUrls(),
    ]);

    if (!config || !programsConfig) return null;

    const programs: Record<string, ProgramDefinition> = {};
    for (const [key, programConfig] of Object.entries(programsConfig)) {
      if (key === "$schema") continue;
      programs[key] = parseProgramConfig(programConfig as ProgramConfig);
    }

    const years = collectYears(programs);
    const now = new Date();

    const data: ServiceProvidersData = {};
    for (const year of years) {
      data[year] = {};
      for (const provider of config.providers) {
        data[year][provider.slug] = Object.fromEntries(
          QUARTERS.map((quarter) => [
            quarter,
            buildQuarterReport(year, quarter, provider.reports, now),
          ]),
        ) as YearData;
      }
    }

    return { config, programs, data, avatarUrls };
  };
