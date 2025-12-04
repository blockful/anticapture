"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initialMetrics } from "@/features/token-distribution/utils";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import { ChartDataSetPoint } from "@/shared/dao-config/types";

export function useTokenDistributionParams(chartData: ChartDataSetPoint[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { metrics, setMetrics, hasTransfer, setHasTransfer } =
    useTokenDistributionStore();

  const brushRange = useBrushStore((s) => s.brushRange);

  const initialized = useRef(false);

  useEffect(() => {
    if (!chartData?.length) return;
    if (initialized.current) return;

    initialized.current = true;

    // metrics
    const rawMetrics = searchParams.get("metrics");
    if (rawMetrics) {
      setMetrics(rawMetrics.split(","));
    } else if (metrics.length === 0) {
      setMetrics(initialMetrics);
    }

    // hasTransfer
    const ht = searchParams.get("hasTransfer");
    setHasTransfer(ht ? ht === "true" : true);

    // brush: startDate / endDate
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");

    if (start && end) {
      const startIndex = chartData.findIndex((p) => p.date === Number(start));
      const endIndex = chartData.findIndex((p) => p.date === Number(end));

      useBrushStore.setState({
        brushRange: {
          startIndex: startIndex >= 0 ? startIndex : 0,
          endIndex: endIndex >= 0 ? endIndex : chartData.length - 1,
        },
      });
    }
  }, [chartData, searchParams, metrics.length, setMetrics, setHasTransfer]);

  useEffect(() => {
    if (!initialized.current) return;
    if (!chartData?.length) return;

    const params = new URLSearchParams(searchParams.toString());

    // metrics
    if (!metrics.length) params.delete("metrics");
    else params.set("metrics", metrics.join(","));

    // hasTransfer
    params.set("hasTransfer", String(hasTransfer));

    // brush
    const start = chartData[brushRange.startIndex]?.date;
    const end = chartData[brushRange.endIndex]?.date;

    if (start) params.set("startDate", String(start));
    if (end) params.set("endDate", String(end));

    const newUrl = `?${params.toString()}`;
    const oldUrl = `?${searchParams.toString()}`;

    if (newUrl !== oldUrl) {
      router.replace(newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, hasTransfer, brushRange, chartData, router]);
}
