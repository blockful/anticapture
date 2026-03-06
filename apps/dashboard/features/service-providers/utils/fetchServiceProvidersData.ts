import {
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
  QUARTERS,
} from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterKey,
  type QuarterReport,
  type YearData,
} from "@/features/service-providers/types";

import { computeQuarterStatus } from "./computeQuarterStatus";
import { extractUrlFromMarkdown } from "./extractUrlFromMarkdown";

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
      next: { revalidate: 1 },
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
    { next: { revalidate: 3600 } },
  );

  if (!treeResponse.ok) return {};

  const { tree }: { tree: { path: string; type: string }[] } =
    await treeResponse.json();

  const years = tree
    .filter((item) => item.type === "tree" && /^\d{4}$/.test(item.path))
    .map((item) => Number(item.path));

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
