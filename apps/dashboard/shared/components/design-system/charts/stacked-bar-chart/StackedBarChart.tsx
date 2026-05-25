"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  CHART_FONT_FAMILY,
  getChartTheme,
} from "@/shared/components/design-system/charts/chart-theme";
import type { StackedBarChartProps } from "@/shared/components/design-system/charts/types";
import { cn } from "@/shared/utils/cn";

type TooltipParam = {
  name: string;
  seriesName: string;
  value: number | null | undefined;
  marker: string;
};

// ECharts renders the formatter return value as HTML. Caller-controlled strings
// (series names, axis labels) must be escaped to prevent injection if any
// future consumer passes data-driven labels.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const StackedBarChart = ({
  series,
  xAxisLabels,
  yAxisFormatter,
  xAxisLabelInterval,
  gridRight = 12,
  height = 300,
  className,
}: StackedBarChartProps) => {
  const theme = useMemo(() => getChartTheme(), []);

  const formatValue = yAxisFormatter ?? ((v: number) => String(v));

  const option = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      formatter: (rawParams: TooltipParam | TooltipParam[]) => {
        const params = Array.isArray(rawParams) ? rawParams : [rawParams];
        if (params.length === 0) return "";
        const total = params.reduce((s, p) => s + (p.value ?? 0), 0);
        const header = `<div style="font-weight:600;margin-bottom:4px;">${escapeHtml(params[0].name)}</div>`;
        const rows = params
          .map((p) => {
            const v = p.value ?? 0;
            return (
              `<div style="display:flex;justify-content:space-between;gap:16px;">` +
              `<span>${p.marker}${escapeHtml(p.seriesName)}</span>` +
              `<span style="font-variant-numeric:tabular-nums;">${formatValue(v)}</span>` +
              `</div>`
            );
          })
          .join("");
        const totalRow =
          `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(127,127,127,0.3);font-weight:600;">` +
          `<span>Total</span>` +
          `<span style="font-variant-numeric:tabular-nums;">${formatValue(total)}</span>` +
          `</div>`;
        return header + rows + totalRow;
      },
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
      right: gridRight,
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
          xAxisLabelInterval ??
          (xAxisLabels.length > 12
            ? (index: number) => xAxisLabels[index]?.startsWith("Jan")
            : "auto"),
        formatter:
          xAxisLabels.length > 12
            ? (value: string) => value.split(" ")[1] ?? value
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
