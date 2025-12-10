"use client";

import { useEffect, useRef } from "react";
import { initialMetrics } from "@/features/token-distribution/utils";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { parseAsInteger, useQueryState } from "nuqs";

export function useTokenDistributionParams(chartData: ChartDataSetPoint[]) {
  const [metrics, setMetrics] = useQueryState("metrics");
  const [hasTransfer, setHasTransfer] = useQueryState("hasTransfer");
  const [startDate, setStartDate] = useQueryState("startDate", parseAsInteger);
  const [endDate, setEndDate] = useQueryState("endDate", parseAsInteger);
  const {
    metrics: storeMetrics,
    setMetrics: setStoreMetrics,
    hasTransfer: storeHasTransfer,
    setHasTransfer: setStoreHasTransfer,
  } = useTokenDistributionStore();

  const brushRange = useBrushStore((state) => state.brushRange);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!chartData?.length) return;

    initialized.current = true;

    if (metrics) {
      setStoreMetrics(metrics.split(","));
    } else {
      setStoreMetrics(initialMetrics);
    }

    setStoreHasTransfer(hasTransfer === "true");

    if (startDate && endDate) {
      const startIndex = chartData.findIndex(
        (point) => point.date === startDate,
      );
      const endIndex = chartData.findIndex((point) => point.date === endDate);

      useBrushStore.setState({
        brushRange: {
          startIndex: startIndex >= 0 ? startIndex : 0,
          endIndex: endIndex >= 0 ? endIndex : chartData.length - 1,
        },
      });
    }
  }, [
    chartData,
    metrics?.length,
    setStoreMetrics,
    setStoreHasTransfer,
    startDate,
    endDate,
    hasTransfer,
    storeMetrics.length,
    metrics,
  ]);

  useEffect(() => {
    if (!initialized.current) return;

    // metrics
    if (!storeMetrics.length) setMetrics(null);
    else setMetrics(storeMetrics.join(","));

    // hasTransfer
    setHasTransfer(storeHasTransfer ? "true" : "false");

    // brush
    const start = chartData[brushRange.startIndex]?.date;
    const end = chartData[brushRange.endIndex]?.date;

    if (start) setStartDate(start);
    if (end) setEndDate(end);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeMetrics, storeHasTransfer, brushRange, chartData]);
}
