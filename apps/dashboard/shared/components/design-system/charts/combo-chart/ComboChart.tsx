"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  CHART_FONT_FAMILY,
  getChartTheme,
} from "@/shared/components/design-system/charts/chart-theme";
import type { ComboChartProps } from "@/shared/components/design-system/charts/types";
import { cn } from "@/shared/utils/cn";

/** Per-series tooltip formatting; ECharts hands the value over untyped. */
const tooltipFormatFor = (format?: (value: number) => string) =>
  format
    ? {
        tooltip: {
          valueFormatter: (value: unknown) =>
            typeof value === "number" ? format(value) : String(value ?? ""),
        },
      }
    : {};

export const ComboChart = ({
  barSeries,
  lineSeries,
  xAxisLabels,
  yAxisFormatter,
  rightAxisFormatter,
  xAxisLabelInterval,
  xAxisLabelFormatter,
  markers,
  height = 300,
  className,
}: ComboChartProps) => {
  const theme = useMemo(() => getChartTheme(), []);

  // Monthly series (the default): past 12 categories, print one label a year.
  const isLongMonthlyAxis = xAxisLabels.length > 12;
  const labelInterval =
    xAxisLabelInterval ??
    (isLongMonthlyAxis
      ? (index: number) => xAxisLabels[index]?.startsWith("Jan")
      : "auto");
  const labelFormatter =
    xAxisLabelFormatter ??
    (xAxisLabelInterval === undefined && isLongMonthlyAxis
      ? (value: string) => value.split(" ")[1] ?? value
      : undefined);

  const drawnMarkers = (markers ?? []).filter(
    (marker) =>
      Number.isInteger(marker.index) &&
      marker.index >= 0 &&
      marker.index < xAxisLabels.length,
  );
  const markLine =
    drawnMarkers.length > 0
      ? {
          markLine: {
            symbol: "none" as const,
            silent: true,
            lineStyle: {
              color: theme.axisLabelColor,
              type: "dashed" as const,
              width: 1,
            },
            label: {
              formatter: (params: { name?: string }) => params.name ?? "",
              fontFamily: CHART_FONT_FAMILY,
              fontSize: 11,
              color: theme.axisLabelColor,
            },
            // The label starts at its line in the left half of the chart and
            // ends at it in the right half, so it never runs off either edge.
            data: drawnMarkers.map((marker) => ({
              name: marker.label,
              // The category's position: a label can repeat on the axis.
              xAxis: marker.index,
              label: {
                align:
                  marker.index < xAxisLabels.length / 2
                    ? ("left" as const)
                    : ("right" as const),
              },
            })),
          },
        }
      : {};

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
      // Room above the plot for the marker labels.
      top: drawnMarkers.length > 0 ? 28 : 12,
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
        interval: labelInterval,
        formatter: labelFormatter,
        // On a narrow chart the chosen labels can still collide; drop those
        // that would overlap instead of printing them on top of each other.
        hideOverlap: true,
      },
    },
    yAxis: [
      {
        type: "value" as const,
        position: "left" as const,
        alignTicks: true,
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
      {
        type: "value" as const,
        position: "right" as const,
        alignTicks: true,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: CHART_FONT_FAMILY,
          fontSize: 12,
          fontWeight: 500,
          color: theme.axisLabelColor,
          formatter: rightAxisFormatter ?? yAxisFormatter,
        },
      },
    ],
    series: [
      ...lineSeries.map((s) => ({
        name: s.name,
        type: "line" as const,
        yAxisIndex: 1,
        data: s.data,
        lineStyle: { color: s.color, width: 2 },
        itemStyle: { color: s.color },
        symbol: "none" as const,
        smooth: s.smooth ?? true,
        ...tooltipFormatFor(s.valueFormatter),
      })),
      ...barSeries.map((s, index) => ({
        name: s.name,
        type: "bar" as const,
        yAxisIndex: 0,
        data: s.data,
        ...(s.stack ? { stack: s.stack } : {}),
        ...tooltipFormatFor(s.valueFormatter),
        // Markers hang off the first bar series so they are drawn once.
        ...(index === 0 ? markLine : {}),
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
