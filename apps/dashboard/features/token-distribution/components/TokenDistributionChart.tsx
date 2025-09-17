/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  CartesianGrid,
  Line,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Brush,
  ComposedChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/shared/components/ui/chart";
import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
import { TokenDistributionCustomTooltip } from "@/features/token-distribution/components";
import { formatNumberUserReadable } from "@/shared/utils";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { timestampToReadableDate } from "@/shared/utils";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading-animation.json";
import { useEffect, useRef } from "react";
import { AlertOctagon } from "lucide-react";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

interface TokenDistributionChartProps {
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  chartData?: ChartDataSetPoint[];
  hoveredMetricKey?: string | null;
  isLoading?: boolean;
  error?: Error | null;
  daoId: DaoIdEnum;
}

export const TokenDistributionChart = ({
  appliedMetrics,
  chartConfig,
  chartData,
  hoveredMetricKey,
  isLoading = false,
  error = null,
  daoId,
}: TokenDistributionChartProps) => {
  const { brushRange, setBrushRange } = useBrushStore();
  const hasInitialized = useRef(false);
  const daoConfig = daoConfigByDaoId[daoId];

  useEffect(() => {
    if (chartData && chartData.length > 0 && !hasInitialized.current) {
      setBrushRange({
        startIndex: 0,
        endIndex: chartData.length - 1,
      });
      hasInitialized.current = true;
    }
  }, [chartData, setBrushRange]);

  // Show error state
  if (error) {
    return (
      <BlankSlate
        variant="title"
        icon={AlertOctagon}
        title="Error loading chart data"
        description="Please check your network connection and refresh the page."
      />
    );
  }

  // Show loading state
  if (isLoading || !chartData) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <div className="text-center">
          <Lottie animationData={loadingAnimation} height={400} width={400} />
        </div>
      </div>
    );
  }

  // Show research pending when tokenDistribution is not configured in dao-config
  if (daoConfig && daoConfig.tokenDistribution === false) {
    return (
      <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <ResearchPendingChartBlur />
      </div>
    );
  }

  return (
    <div className="border-light-dark bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
      <ChartContainer
        className="h-full w-full justify-start"
        config={chartConfig}
      >
        <ComposedChart data={chartData} syncId="tokenChart">
          <defs>
            {/* Generate gradients for each AREA metric */}
            {appliedMetrics
              .filter((metricKey) => chartConfig[metricKey]?.type === "AREA")
              .map((metricKey) => {
                const config = chartConfig[metricKey];
                return (
                  <linearGradient
                    key={`gradient-${metricKey}`}
                    id={`gradient-${metricKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={config.color}
                      stopOpacity={0.05}
                    />
                    <stop
                      offset="95%"
                      stopColor={config.color}
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                );
              })}
          </defs>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickMargin={8}
            tickFormatter={(date) => timestampToReadableDate(date)}
            padding="gap"
          />
          {/* DEFAULT AXIS - Required for Recharts compatibility */}
          <YAxis yAxisId={0} hide domain={["auto", "auto"]} />

          {/* PRIMARY AXIS - For larger scale metrics */}
          <YAxis
            yAxisId="primary"
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatNumberUserReadable(Number(value))}
            tick={{ fontSize: 10 }}
            width={50}
          />

          {/* SECONDARY AXIS - For metrics configured with axis: "secondary" (TOKEN_PRICE) */}
          {appliedMetrics.some(
            (key) => chartConfig[key]?.axis === "secondary",
          ) && (
            <YAxis
              yAxisId="secondary"
              orientation="right"
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${Number(value)}`}
              stroke="#8884d8"
              tick={{ fill: "#8884d8", fontSize: 10 }}
              width={45}
            />
          )}

          {/* TERTIARY AXIS - For BAR type metrics (right side) */}
          {appliedMetrics.some((key) => chartConfig[key]?.type === "BAR") && (
            <YAxis
              yAxisId="bars"
              orientation="right"
              domain={[0, "dataMax"]}
              tickFormatter={(value) => formatNumberUserReadable(Number(value))}
              stroke="#10B981"
              tick={{ fill: "#10B981", fontSize: 10 }}
              width={50}
              allowDataOverflow={true}
            />
          )}

          {/* TERTIARY AXIS - For SPORADIC_LINE type metrics (right side) */}
          {appliedMetrics.some(
            (key) => chartConfig[key]?.type === "SPORADIC_LINE",
          ) && (
            <YAxis
              yAxisId="bars"
              orientation="right"
              domain={[0, "dataMax"]}
              tickFormatter={(value) => formatNumberUserReadable(Number(value))}
              stroke="#10B981"
              tick={{ fill: "#10B981", fontSize: 10 }}
              width={50}
              hide
            />
          )}

          {/* Render SPORADIC_LINE metrics as event markers with dashed lines and arrows - BEHIND other elements */}
          {appliedMetrics
            .filter(
              (metricKey) => chartConfig[metricKey]?.type === "SPORADIC_LINE",
            )
            .map((metricKey) => {
              // const config = chartConfig[metricKey];
              const isOpaque =
                hoveredMetricKey && !(metricKey === hoveredMetricKey);

              // Get all dates where this metric has values (strings or numbers > 0)
              const eventDates =
                chartData?.filter((d) => {
                  const value = d[metricKey];
                  if (typeof value === "string") {
                    return value && value.length > 0;
                  }
                  return value && Number(value) > 0;
                }) || [];

              // // The stroke color here is different from metrics to render the dialog with different colros
              return eventDates.map((eventData, index) => (
                <ReferenceLine
                  key={`${metricKey}-event-${index}`}
                  x={eventData.date}
                  stroke="#FAFAFA66"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={isOpaque ? 0.3 : 1}
                />
              ));
            })
            .flat()}

          {/* Render LINE metrics - DYNAMIC AXIS ASSIGNMENT */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config || config.type !== "LINE") {
              return null;
            }

            return (
              <Line
                key={`${metricKey}-line`}
                dataKey={metricKey}
                stroke={config.color}
                strokeWidth={2}
                strokeOpacity={isOpaque ? 0.3 : 1}
                dot={false}
                yAxisId={config.axis || "primary"}
              />
            );
          })}

          {/* Render AREA metrics - DYNAMIC AXIS ASSIGNMENT */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config || config.type !== "AREA") {
              return null;
            }

            return (
              <Area
                key={`${metricKey}-area`}
                dataKey={metricKey}
                stroke={config.color}
                fill={`url(#gradient-${metricKey})`}
                fillOpacity={isOpaque ? 0.3 : 1}
                strokeWidth={2}
                strokeOpacity={isOpaque ? 0.3 : 0.8}
                yAxisId={config.axis || "primary"}
                type="monotone"
                dot={false}
              />
            );
          })}

          {/* Render BARS for BAR type metrics */}
          {appliedMetrics.map((metricKey) => {
            const isOpaque =
              hoveredMetricKey && !(metricKey === hoveredMetricKey);
            const config = chartConfig[metricKey];

            if (!config || config.type !== "BAR") {
              return null;
            }

            return (
              <Bar
                key={`${metricKey}-bar`}
                dataKey={metricKey}
                fill={config.color}
                opacity={isOpaque ? 0.3 : 0.8}
                barSize={40}
                yAxisId="bars"
                radius={[2, 2, 0, 0]}
              />
            );
          })}

          {/* Add invisible bars for SPORADIC_LINE metrics so they appear in tooltip  Because the Reference-Line not appear with the tooltip*/}
          {appliedMetrics.map((metricKey) => {
            const config = chartConfig[metricKey];

            if (!config || config.type !== "SPORADIC_LINE") {
              return null;
            }

            return (
              <Bar
                key={`${metricKey}-invisible-bar`}
                dataKey={metricKey}
                fill="transparent"
                opacity={0}
                barSize={1}
                yAxisId="bars"
              />
            );
          })}

          <Tooltip
            content={
              <TokenDistributionCustomTooltip chartConfig={chartConfig} />
            }
          />

          <Brush
            dataKey="date"
            height={32}
            stroke="#333"
            fill="#1f1f1f"
            tickFormatter={(timestamp) => timestampToReadableDate(timestamp)}
            travellerWidth={10}
            startIndex={brushRange.startIndex}
            endIndex={brushRange.endIndex}
            onChange={(brushArea) => {
              if (brushArea && chartData) {
                const { startIndex = 0, endIndex = chartData.length - 1 } =
                  brushArea;

                // Update brush range in store
                setBrushRange({ startIndex, endIndex });
              }
            }}
          >
            <AreaChart height={32} width={1128} data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis yAxisId="brushAxis" hide />
              <Area
                type="monotone"
                dataKey={appliedMetrics[0]}
                stroke="#333"
                fill="#1f1f1f"
                fillOpacity={0.3}
                strokeWidth={1}
                dot={false}
                yAxisId="brushAxis"
              />
            </AreaChart>
          </Brush>
        </ComposedChart>
      </ChartContainer>
      <AnticaptureWatermark />
    </div>
  );
};
