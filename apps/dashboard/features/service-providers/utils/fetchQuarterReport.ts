import { GITHUB_RAW_BASE } from "@/features/service-providers/constants/ens-service-providers";
import {
  type QuarterKey,
  type QuarterReport,
} from "@/features/service-providers/types";

import { computeQuarterStatus } from "./computeQuarterStatus";
import { extractUrlFromMarkdown } from "./extractUrlFromMarkdown";

export const fetchQuarterReport = async (
  slug: string,
  year: number,
  quarter: QuarterKey,
  now: Date,
): Promise<QuarterReport> => {
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
};
