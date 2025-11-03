import { ChartContainer } from "@/shared/components/ui/chart";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TokenDistributionCustomTooltip } from "@/features/token-distribution/components/TokenDistributionCustomTooltip";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricSchema } from "@/features/token-distribution/utils";
import { ChartDataSetPoint } from "@/shared/dao-config/types";

export const OverviewComposedChart = ({
  chartData,
  appliedMetrics,
  chartConfig,
  dynamicTicks,
  formatTick,
  hoveredMetricKey,
  daoId,
}: {
  chartData: ChartDataSetPoint[];
  appliedMetrics: string[];
  chartConfig: Record<string, MetricSchema>;
  isMobile: boolean;
  dynamicTicks: number[];
  hoveredMetricKey?: string | null;
  formatTick: (tick: number) => string;
  daoId: DaoIdEnum;
}) => {
  return (
    <ChartContainer
      className="h-full w-full justify-start"
      config={chartConfig}
    >
      <ComposedChart data={chartData}>
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
          padding={{ left: 0, right: 20 }}
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
          width={35}
        />

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

        <Tooltip
          content={
            <TokenDistributionCustomTooltip
              chartConfig={chartConfig}
              daoId={daoId}
            />
          }
        />
      </ComposedChart>
    </ChartContainer>
  );
};
