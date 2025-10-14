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
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { AnticaptureWatermark } from "@/shared/components/icons/AnticaptureWatermark";
import { timestampToReadableDate } from "@/shared/utils";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading-animation.json";
import { useEffect, useMemo, useRef } from "react";
import { AlertOctagon } from "lucide-react";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { useScreenSize } from "@/shared/hooks/useScreenSize";

interface TokenDistributionChartProps {
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  chartData?: ChartDataSetPoint[];
  hoveredMetricKey?: string | null;
  isLoading?: boolean;
  error?: Error | null;
  daoId: DaoIdEnum;
  context?: "overview" | "section";
}

export const TokenDistributionChart = ({
  appliedMetrics,
  chartConfig,
  chartData,
  hoveredMetricKey,
  isLoading = false,
  error = null,
  daoId,
  context = "section",
}: TokenDistributionChartProps) => {
  const { brushRange, setBrushRange } = useBrushStore();
  const hasInitialized = useRef(false);
  const daoConfig = daoConfigByDaoId[daoId];
  const { isMobile } = useScreenSize();

  useEffect(() => {
    if (chartData && chartData.length > 0 && !hasInitialized.current) {
      setBrushRange({
        startIndex: 0,
        endIndex: chartData.length - 1,
      });
      hasInitialized.current = true;
    }
  }, [chartData, setBrushRange]);

  const interval = useMemo(() => {
    if (!chartData || chartData.length < 2) return "monthly";
    const start = brushRange.startIndex ?? 0;
    const end = brushRange.endIndex ?? chartData.length - 1;
    const slicedData = chartData.slice(start, end + 1);
    if (slicedData.length < 2) return "monthly";

    const startDate = new Date(slicedData[0].date * 1000);
    const endDate = new Date(slicedData[slicedData.length - 1].date * 1000);
    const daysInRange =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysInRange <= 14) return "daily";
    if (daysInRange <= 90) return "weekly";
    if (daysInRange <= 264) return "monthly";
    return "quarterly";
  }, [chartData, brushRange.startIndex, brushRange.endIndex]);

  const dynamicTicks = useMemo(() => {
    if (!chartData || chartData.length < 2) return [];

    const start = brushRange.startIndex ?? 0;
    const end = brushRange.endIndex ?? chartData.length - 1;
    const slicedData = chartData.slice(start, end + 1);

    if (slicedData.length < 2) return [slicedData[0].date];

    if (interval === "daily") {
      return slicedData.map((point) => point.date);
    }

    const firstDate = slicedData[0].date;
    const lastDate = slicedData[slicedData.length - 1].date;

    const maxTicks = 7;
    const tickCount = Math.min(slicedData.length, maxTicks);

    if (tickCount <= 2) {
      return [firstDate, lastDate];
    }

    const duration = lastDate - firstDate;
    const timeStep = duration / (tickCount - 1);

    const idealTimestamps = Array.from(
      { length: tickCount },
      (_, i) => firstDate + i * timeStep,
    );

    const finalTicks = idealTimestamps.map((idealTimestamp) => {
      let closestPoint = slicedData[0];
      let minDiff = Math.abs(closestPoint.date - idealTimestamp);

      for (const point of slicedData) {
        const diff = Math.abs(point.date - idealTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }
      return closestPoint.date;
    });

    return finalTicks;
  }, [chartData, brushRange.startIndex, brushRange.endIndex, interval]);

  const dynamicBarSize = useMemo(() => {
    if (!chartData || chartData.length === 0) return 2;

    const start = brushRange.startIndex ?? 0;
    const end = brushRange.endIndex ?? chartData.length - 1;
    const visiblePoints = end - start + 1;

    if (visiblePoints <= 1) return 50;

    const baseWidthFactor = 1500;
    const calculatedSize = baseWidthFactor / visiblePoints;
    const minSize = 2;
    const maxSize = 50;

    return Math.max(minSize, Math.min(calculatedSize, maxSize));
  }, [chartData, brushRange.startIndex, brushRange.endIndex]);

  const formatTick = (tick: number) => {
    if (interval === "daily" || interval === "weekly") {
      return timestampToReadableDate(tick, "day_abbreviated");
    }
    return timestampToReadableDate(tick, "abbreviated");
  };

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
      <div className="border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center rounded-lg">
        <div className="text-center">
          <Lottie animationData={loadingAnimation} height={400} width={400} />
        </div>
      </div>
    );
  }

  // Show research pending when tokenDistribution is not configured in dao-config
  if (daoConfig && daoConfig.tokenDistribution === false) {
    return (
      <div className="sm:border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center sm:rounded-lg">
        <ResearchPendingChartBlur />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "sm:border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center sm:rounded-lg",
        { "-mb-1 h-32": context === "overview" },
      )}
    >
      <ChartContainer
        className="h-full w-full justify-start"
        config={chartConfig}
      >
        <ComposedChart
          data={chartData}
          margin={
            context === "overview"
              ? { top: 0, right: 0, left: 0, bottom: 0 }
              : {
                  right: isMobile ? 5 : 20,
                  left: isMobile ? -35 : 0,
                  top: isMobile ? 5 : 10,
                  bottom: isMobile ? 5 : 10,
                }
          }
        >
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
            ticks={dynamicTicks}
            interval={0}
            tickMargin={8}
            tickFormatter={formatTick}
            allowDuplicatedCategory={false}
            padding={
              context === "overview"
                ? { left: 0, right: 20 }
                : { left: 20, right: 20 }
            }
          />
          {/* DEFAULT AXIS - Required for Recharts compatibility */}
          <YAxis yAxisId={0} hide domain={["auto", "auto"]} />

          {/* PRIMARY AXIS - For larger scale metrics */}
          <YAxis
            yAxisId="primary"
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              `${formatNumberUserReadable(Number(value))}\n${daoId}`
            }
            tick={{ fontSize: 10 }}
            width={context === "overview" ? 35 : 50}
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
              tickFormatter={(value) =>
                `${formatNumberUserReadable(Number(value))} ${daoId}`
              }
              stroke="#ffffff"
              tick={(props) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#ffffff"
                    fontSize={10}
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {`${formatNumberUserReadable(Number(payload.value))} ${daoId}`}
                  </text>
                );
              }}
              width={80}
              allowDataOverflow={true}
              label={{
                value: "Volume",
                angle: 90,
                position: "insideRight",
                style: {
                  textAnchor: "middle",
                  fill: "#ffffff",
                  fontSize: "12px",
                },
              }}
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
                opacity={isOpaque ? 0.3 : 0.5}
                barSize={dynamicBarSize}
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
              <TokenDistributionCustomTooltip
                chartConfig={chartConfig}
                daoId={daoId}
              />
            }
          />

          {context === "section" && (
            <Brush
              dataKey="date"
              height={32}
              stroke="#333"
              fill="#1f1f1f"
              tickFormatter={(timestamp) =>
                timestampToReadableDate(timestamp, "abbreviated")
              }
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
          )}
        </ComposedChart>
      </ChartContainer>
      <AnticaptureWatermark />
    </div>
  );
};
