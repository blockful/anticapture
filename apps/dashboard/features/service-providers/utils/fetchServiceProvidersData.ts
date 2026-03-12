import {
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
  QUARTER_DUE_DATES,
  QUARTERS,
} from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterKey,
  type QuarterReport,
  type YearData,
} from "@/features/service-providers/types";
import { computeQuarterStatus } from "@/features/service-providers/utils/computeQuarterStatus";
import { extractUrlFromMarkdown } from "@/features/service-providers/utils/extractUrlFromMarkdown";

const githubHeaders: HeadersInit = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};

export type ServiceProvidersData = Record<number, Record<string, YearData>>;

const fetchQuarterReport = async (
  year: number,
  slug: string,
  quarter: QuarterKey,
  existingFiles: Set<string>,
  now: Date,
): Promise<QuarterReport> => {
  const filePath = `${year}/${slug}/${quarter.toLowerCase()}.md`;

  if (existingFiles.has(filePath)) {
    const response = await fetch(`${GITHUB_RAW_BASE}/${filePath}`, {
      headers: githubHeaders,
      next: { revalidate: 3600 },
    });
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

export const fetchServiceProvidersData = async (
  slugs: string[],
): Promise<ServiceProvidersData> => {
  const treeResponse = await fetch(
    `${GITHUB_API_BASE}/git/trees/main?recursive=1`,
    { headers: githubHeaders, next: { revalidate: 3600 } },
  );

  if (!treeResponse.ok) return {};

  const { tree }: { tree: { path: string; type: string }[] } =
    await treeResponse.json();

  const years = Object.keys(QUARTER_DUE_DATES).map(Number);

  const existingFiles = new Set(
    tree
      .filter(
        (item) =>
          item.type === "blob" &&
          /^\d{4}\/[\w-]+\/(q1|q2|q3|q4)\.md$/i.test(item.path),
      )
      .map((item) => item.path.toLowerCase()),
  );

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

  return Object.fromEntries(yearEntries);
};
