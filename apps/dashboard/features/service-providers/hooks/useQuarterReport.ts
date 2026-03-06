"use client";

import { useQuery } from "@tanstack/react-query";

import {
  type QuarterKey,
  type QuarterReport,
} from "@/features/service-providers/types";
import { fetchQuarterReport } from "@/features/service-providers/utils/fetchQuarterReport";

export const useQuarterReport = (
  slug: string,
  year: number,
  quarter: QuarterKey,
) => {
  return useQuery<QuarterReport, Error>({
    queryKey: ["quarter-report", slug, year, quarter],
    queryFn: () => fetchQuarterReport(slug, year, quarter, new Date()),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};
