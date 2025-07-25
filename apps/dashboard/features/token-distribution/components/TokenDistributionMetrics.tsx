import * as React from "react";
import { CardTitle } from "@/shared/components/ui/card";
import { X } from "lucide-react";
import { TokenDistributionDialog } from "@/features/token-distribution/components";
import { Button } from "@/shared/components/ui/button";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

// TODO: move to shared when types is known
interface Metric {
  label: string;
  color: string;
  category: string;
}

interface MetricWithKey extends Metric {
  key: MetricTypesEnum;
}

interface TokenDistributionMetricsProps {
  appliedMetrics: MetricTypesEnum[];
  setAppliedMetrics: React.Dispatch<React.SetStateAction<MetricTypesEnum[]>>;
  setHoveredMetricKey: React.Dispatch<
    React.SetStateAction<MetricTypesEnum | null>
  >;
  metricsSchema: Record<MetricTypesEnum, Metric>;
}

const formatMetricsByCategory = (
  metrics: Record<MetricTypesEnum, Metric>,
): Record<string, MetricWithKey[]> => {
  return Object.entries(metrics).reduce(
    (grouped, [key, metric]) => {
      const metricKey = key as MetricTypesEnum;
      const { category } = metric;

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({ ...metric, key: metricKey });

      return grouped;
    },
    {} as Record<string, MetricWithKey[]>,
  );
};

export const TokenDistributionMetrics = ({
  appliedMetrics,
  setAppliedMetrics,
  metricsSchema,
  setHoveredMetricKey,
}: TokenDistributionMetricsProps) => {
  const handleApplyMetric = (newMetrics: MetricTypesEnum[]) => {
    setAppliedMetrics((prev) => {
      return [...prev, ...newMetrics];
    });
  };

  const handleRemoveMetric = (metricToRemove: MetricTypesEnum) => {
    setAppliedMetrics((prev) =>
      prev.filter((metric) => metric !== metricToRemove),
    );
    setHoveredMetricKey(null);
  };

  const appliedMetricsSchema = Object.fromEntries(
    appliedMetrics
      .map((key) => [key, metricsSchema[key]])
      .filter(([, metric]) => !!metric),
  ) as Record<MetricTypesEnum, Metric>;

  const appliedMetricsFormatted = formatMetricsByCategory(appliedMetricsSchema);
  const metricsSchemaFormatted = formatMetricsByCategory(metricsSchema);

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="relative flex h-full w-full flex-col gap-4 sm:gap-6">
        <div className="scrollbar-none flex max-h-96 flex-col gap-2 overflow-y-auto">
          {Object.entries(appliedMetricsFormatted).map(
            ([category, metrics]) => (
              <div key={category} className="mb-4 flex flex-col gap-2">
                <CardTitle className="!text-alternative-sm text-secondary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                  {category}
                </CardTitle>
                {metrics.map((metric) => (
                  <Button
                    key={metric.key}
                    variant={"ghost"}
                    onClick={() => {
                      const metricKey = appliedMetrics.find(
                        (key) => key === metric.key,
                      );
                      if (metricKey) handleRemoveMetric(metricKey);
                    }}
                    className="border-light-dark flex h-7 w-full items-center justify-between gap-2 rounded-sm border px-2 hover:opacity-80"
                    onMouseEnter={() => {
                      const hoveredKey = appliedMetrics.find(
                        (key) => key === metric.key,
                      );
                      setHoveredMetricKey(hoveredKey ?? null);
                    }}
                    onMouseLeave={() => setHoveredMetricKey(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-xs size-2"
                        style={{ backgroundColor: metric.color }}
                      />
                      <span className="text-primary text-sm font-medium">
                        {metric.label}
                      </span>
                    </div>
                    <div className="h3 w-3">
                      <X className="text-secondary" />
                    </div>
                  </Button>
                ))}
              </div>
            ),
          )}
        </div>
        <div className="from-surface-default pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t to-transparent" />
      </div>
      <TokenDistributionDialog
        appliedMetrics={appliedMetricsFormatted}
        metricsSchema={metricsSchemaFormatted}
        onApply={handleApplyMetric}
      />
    </div>
  );
};
