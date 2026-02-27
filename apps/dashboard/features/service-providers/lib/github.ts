import {
  QUARTER_DUE_DATES,
  QuarterKey,
  QuarterReport,
  ReportStatus,
  YearData,
} from "@/features/service-providers/types";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/blockful/spp-accountability/main";

// Years tracked in the GitHub repo (dynamic data source)
export const GITHUB_TRACKED_YEARS = [2026];

function extractUrlFromMarkdown(content: string): string | undefined {
  const match = content.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
  return match?.[1];
}

export function computeQuarterStatus(
  year: number,
  quarter: QuarterKey,
  now: Date,
): ReportStatus {
  const dueDateStr = QUARTER_DUE_DATES[year]?.[quarter]?.dueDate;
  if (!dueDateStr) return "upcoming";

  // Treat deadline as end of day UTC
  const deadline = new Date(`${dueDateStr}T23:59:59Z`);

  if (now > deadline) return "overdue";

  const daysUntilDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline < 30) return "due_soon";

  return "upcoming";
}

async function fetchQuarterReport(
  slug: string,
  year: number,
  quarter: QuarterKey,
  now: Date,
): Promise<QuarterReport> {
  try {
    const url = `${GITHUB_RAW_BASE}/${year}/${slug}/${quarter.toLowerCase()}.md`;
    const response = await fetch(url, { next: { revalidate: 1 } });

    if (response.ok) {
      const content = (await response.text()).trim();
      if (content) {
        const reportUrl = extractUrlFromMarkdown(content);
        return { status: "published", reportUrl };
      }
    }
  } catch {
    // ignore fetch errors, fall through to computed status
  }

  return { status: computeQuarterStatus(year, quarter, now) };
}

export async function fetchProviderYearData(
  slug: string,
  year: number,
): Promise<YearData> {
  const now = new Date();
  const quarters: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

  const [Q1, Q2, Q3, Q4] = await Promise.all(
    quarters.map((q) => fetchQuarterReport(slug, year, q, now)),
  );

  return { Q1, Q2, Q3, Q4 };
}
