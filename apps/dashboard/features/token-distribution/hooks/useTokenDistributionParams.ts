"use client";

import { useEffect, useRef } from "react";
import { initialMetrics } from "@/features/token-distribution/utils";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { parseAsInteger, useQueryState } from "nuqs";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";

export function useTokenDistributionParams(
  chartData: ChartDataSetPoint[],
  daoId: DaoIdEnum,
) {
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

  const brushRange = useBrushStore((s) => s.brushRange);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const filteredMetrics = daoConfig[daoId].notSupportedMetrics
      ? initialMetrics.filter(
          (metric) => !daoConfig[daoId].notSupportedMetrics?.includes(metric),
        )
      : initialMetrics;

    if (!storeMetrics || storeMetrics.length === 0) {
      setStoreMetrics(metrics ? metrics.split(",") : filteredMetrics);
    }

    setStoreHasTransfer(hasTransfer === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialized.current || !chartData?.length) return;

    let startIndex = 0;
    let endIndex = chartData.length - 1;

    if (startDate && endDate) {
      const foundStart = chartData.findIndex((p) => p.date === startDate);
      const foundEnd = chartData.findIndex((p) => p.date === endDate);

      if (foundStart >= 0) startIndex = foundStart;
      if (foundEnd >= 0) endIndex = foundEnd;
    }

    useBrushStore.setState({
      brushRange: { startIndex, endIndex },
    });

    isInitialized.current = true;
  }, [chartData, startDate, endDate]);

  useEffect(() => {
    if (!isInitialized.current) return;

    setMetrics(storeMetrics?.length ? storeMetrics.join(",") : null);

    setHasTransfer(storeHasTransfer ? "true" : "false");

    if (chartData?.length) {
      const start = chartData[brushRange.startIndex]?.date;
      const end = chartData[brushRange.endIndex]?.date;

      if (start !== undefined) setStartDate(start);
      if (end !== undefined) setEndDate(end);
    }
  }, [
    storeMetrics,
    storeHasTransfer,
    brushRange,
    chartData,
    setMetrics,
    setHasTransfer,
    setStartDate,
    setEndDate,
  ]);
}
