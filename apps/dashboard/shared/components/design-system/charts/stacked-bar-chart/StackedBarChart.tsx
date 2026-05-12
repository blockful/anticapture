"use client";

import ReactECharts from "echarts-for-react";

import type { StackedBarChartProps } from "@/shared/components/design-system/charts/types";
import { cn } from "@/shared/utils/cn";

const GRID_LINE_COLOR = "#e4e4e7";
const AXIS_LABEL_COLOR = "#a1a1aa";
const LABEL_FONT_FAMILY = "Inter, sans-serif";
const LEGEND_TEXT_COLOR = "#52525b";

export const StackedBarChart = ({
  series,
  xAxisLabels,
  yAxisFormatter,
  height = 300,
  className,
}: StackedBarChartProps) => {
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
        fontFamily: LABEL_FONT_FAMILY,
        fontSize: 14,
        color: LEGEND_TEXT_COLOR,
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
        fontFamily: LABEL_FONT_FAMILY,
        fontSize: 12,
        fontWeight: 500,
        color: AXIS_LABEL_COLOR,
        // For dense labels (monthly data), show only Jan of each year
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
      splitLine: { lineStyle: { color: GRID_LINE_COLOR } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: LABEL_FONT_FAMILY,
        fontSize: 12,
        fontWeight: 500,
        color: AXIS_LABEL_COLOR,
        formatter: yAxisFormatter,
      },
    },
    series: series.map((s) => ({
      name: s.name,
      type: "bar" as const,
      stack: "total",
      data: s.data,
      itemStyle: { color: s.color, borderRadius: 0 },
      emphasis: { focus: "series" as const },
      barMaxWidth: 40,
    })),
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
