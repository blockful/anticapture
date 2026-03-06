import {
  type QuarterKey,
  type YearData,
} from "@/features/service-providers/types";
import { fetchQuarterReport } from "@/features/service-providers/utils/fetchQuarterReport";

export const fetchProviderYearData = async (
  slug: string,
  year: number,
): Promise<YearData> => {
  const now = new Date();
  const quarters: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

  const [Q1, Q2, Q3, Q4] = await Promise.all(
    quarters.map((q) => fetchQuarterReport(slug, year, q, now)),
  );

  return { Q1, Q2, Q3, Q4 };
};
