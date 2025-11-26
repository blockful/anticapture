import { MetricSchema } from "@/features/token-distribution/utils/metrics";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import { ResearchPendingChartBlur } from "@/shared/components/charts/ResearchPendingChartBlur";
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
import { OverviewComposedChart } from "@/features/token-distribution/components/OverviewComposedChart";
import { SectionComposedChart } from "@/features/token-distribution/components/SectionComposedChart";
import { TokenDistributionWrapper } from "@/features/token-distribution/components/TokenDistributionWrapper";

interface TokenDistributionChartProps {
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  context: "overview" | "section";
  daoId: DaoIdEnum;
  chartData?: ChartDataSetPoint[];
  hoveredMetricKey?: string | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const TokenDistributionChart = ({
  appliedMetrics,
  chartConfig,
  chartData,
  hoveredMetricKey,
  isLoading = false,
  error = null,
  daoId,
  context,
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
      <TokenDistributionWrapper context={context}>
        <div className="text-center">
          <Lottie animationData={loadingAnimation} height={400} width={400} />
        </div>
      </TokenDistributionWrapper>
    );
  }

  // Show research pending when tokenDistribution is not configured in dao-config
  if (daoConfig && daoConfig.tokenDistribution === false) {
    return (
      <TokenDistributionWrapper context={context}>
        <ResearchPendingChartBlur />
      </TokenDistributionWrapper>
    );
  }

  return (
    <TokenDistributionWrapper context={context}>
      {context === "overview" ? (
        <OverviewComposedChart
          appliedMetrics={appliedMetrics}
          dynamicTicks={dynamicTicks}
          formatTick={formatTick}
          chartConfig={chartConfig}
          chartData={chartData}
          isMobile={isMobile}
          daoId={daoId}
        />
      ) : (
        <SectionComposedChart
          appliedMetrics={appliedMetrics}
          brushRange={brushRange}
          dynamicBarSize={dynamicBarSize}
          dynamicTicks={dynamicTicks}
          formatTick={formatTick}
          hoveredMetricKey={hoveredMetricKey}
          setBrushRange={setBrushRange}
          chartConfig={chartConfig}
          chartData={chartData}
          isMobile={isMobile}
          daoId={daoId}
        />
      )}
      <AnticaptureWatermark />
    </TokenDistributionWrapper>
  );
};
