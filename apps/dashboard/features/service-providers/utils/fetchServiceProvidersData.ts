import {
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
} from "@/features/service-providers/constants/ens-service-providers";
import type {
  ParsedQuarter,
  ProgramConfig,
  ProgramDefinition,
  ProvidersConfig,
  QuarterKey,
  QuarterReport,
  YearData,
} from "@/features/service-providers/types";
import { computeQuarterStatus } from "@/features/service-providers/utils/computeQuarterStatus";
import { extractUrlFromMarkdown } from "@/features/service-providers/utils/extractUrlFromMarkdown";

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
  const base = {
    forumUrl: config.forumUrl,
    voteUrl: config.voteUrl,
  };

  if (config.year1Quarters || config.year2Quarters) {
    return {
      ...base,
      year1Quarters: (config.year1Quarters ?? [])
        .map(parseQuarterString)
        .filter((q): q is ParsedQuarter => q !== null),
      year2Quarters: (config.year2Quarters ?? [])
        .map(parseQuarterString)
        .filter((q): q is ParsedQuarter => q !== null),
    };
  }

  return {
    ...base,
    year1Quarters: (config.quarters ?? [])
      .map(parseQuarterString)
      .filter((q): q is ParsedQuarter => q !== null),
    year2Quarters: [],
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

const fetchQuarterReport = async (
  year: number,
  slug: string,
  quarter: QuarterKey,
  existingFiles: Set<string>,
  now: Date,
): Promise<QuarterReport> => {
  const filePath = `${year}/${slug}/${quarter.toLowerCase()}.md`;

  if (existingFiles.has(filePath)) {
    const response = await fetch(`${GITHUB_RAW_BASE}/${filePath}`);
    if (response.ok) {
      const content = (await response.text()).trim();
      if (content) {
        return {
          status: "published",
          reportUrl: extractUrlFromMarkdown(content),
        };
      }
    }
  }

  return { status: computeQuarterStatus(year, quarter, now) };
};

async function fetchProvidersConfig(): Promise<ProvidersConfig | null> {
  try {
    const response = await fetch(`${GITHUB_RAW_BASE}/providers.json`);
    if (!response.ok) return null;
    return (await response.json()) as ProvidersConfig;
  } catch {
    return null;
  }
}

export const fetchServiceProvidersData =
  async (): Promise<ServiceProvidersResult | null> => {
    const [treeResponse, config] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/git/trees/main?recursive=1`),
      fetchProvidersConfig(),
    ]);

    if (!config) return null;

    const programs: Record<string, ProgramDefinition> = {};
    for (const [key, programConfig] of Object.entries(config.programs)) {
      programs[key] = parseProgramConfig(programConfig);
    }

    const years = collectYears(programs);
    const slugs = config.providers.map((p) => p.slug);

    let existingFiles = new Set<string>();
    const avatarUrls: Record<string, string> = {};

    if (treeResponse.ok) {
      const { tree }: { tree: { path: string; type: string }[] } =
        await treeResponse.json();

      existingFiles = new Set(
        tree
          .filter(
            (item) =>
              item.type === "blob" &&
              /^\d{4}\/[\w-]+\/(q1|q2|q3|q4)\.md$/i.test(item.path),
          )
          .map((item) => item.path.toLowerCase()),
      );

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
    }

    const now = new Date();

    const yearEntries = await Promise.all(
      years.map(async (year) => {
        const slugEntries = await Promise.all(
          slugs.map(async (slug) => {
            const quarterEntries = await Promise.all(
              QUARTERS.map(
                async (quarter) =>
                  [
                    quarter,
                    await fetchQuarterReport(
                      year,
                      slug,
                      quarter,
                      existingFiles,
                      now,
                    ),
                  ] as const,
              ),
            );
            return [
              slug,
              Object.fromEntries(quarterEntries) as YearData,
            ] as const;
          }),
        );
        return [year, Object.fromEntries(slugEntries)] as const;
      }),
    );

    return {
      config,
      programs,
      data: Object.fromEntries(yearEntries),
      avatarUrls,
    };
  };
