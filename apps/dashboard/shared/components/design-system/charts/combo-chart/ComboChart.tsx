"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  CHART_FONT_FAMILY,
  getChartTheme,
} from "@/shared/components/design-system/charts/chart-theme";
import type { ComboChartProps } from "@/shared/components/design-system/charts/types";
import { cn } from "@/shared/utils/cn";

export const ComboChart = ({
  barSeries,
  lineSeries,
  xAxisLabels,
  yAxisFormatter,
  height = 300,
  className,
}: ComboChartProps) => {
  const theme = useMemo(() => getChartTheme(), []);

  const option = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
    },
    legend: {
      bottom: 0,
      left: 0,
      icon: "roundRect",
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      textStyle: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: 14,
        color: theme.legendTextColor,
      },
    },
    grid: {
      top: 12,
      right: 12,
      bottom: 56,
      left: 0,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: xAxisLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: 12,
        fontWeight: 500,
        color: theme.axisLabelColor,
        interval:
          xAxisLabels.length > 12
            ? (index: number) => xAxisLabels[index]?.startsWith("Jan")
            : "auto",
        formatter:
          xAxisLabels.length > 12
            ? (value: string) => `20${value.split(" ")[1]}`
            : undefined,
      },
    },
    yAxis: {
      type: "value" as const,
      splitLine: { lineStyle: { color: theme.gridLineColor } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: 12,
        fontWeight: 500,
        color: theme.axisLabelColor,
        formatter: yAxisFormatter,
      },
    },
    series: [
      ...lineSeries.map((s) => ({
        name: s.name,
        type: "line" as const,
        data: s.data,
        lineStyle: { color: s.color, width: 2 },
        itemStyle: { color: s.color },
        symbol: "none" as const,
        smooth: true,
      })),
      ...barSeries.map((s) => ({
        name: s.name,
        type: "bar" as const,
        data: s.data,
        itemStyle: { color: s.color, borderRadius: 0 },
        emphasis: { focus: "series" as const },
        barMaxWidth: 40,
      })),
    ],
  };

  return (
    <div className={cn("w-full", className)}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height }}
        opts={{ renderer: "svg" }}
        notMerge
      />
    </div>
  );
};
