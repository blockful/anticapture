import * as React from "react";
import { CardTitle } from "@/shared/components/ui/card";
import { X } from "lucide-react";
import { ChartMetricsDialog } from "@/features/token-distribution/components";
import { Button } from "@/shared/components/ui/button";

// TODO: move to shared when types is known
interface Metric {
  label: string;
  color: string;
  category: string;
}

interface ChartMetricsProps {
  appliedMetrics: Record<string, Metric>;
  setAppliedMetrics: React.Dispatch<
    React.SetStateAction<Record<string, Metric>>
  >;
  allMetrics: Record<string, Metric>;
}

const formatMetricsByCategory = (metrics: Metric[]) => {
  const metricsValues = Object.values(metrics);

  return metricsValues.reduce<Record<string, Metric[]>>(
    (groupedMetrics, metric) => {
      const { category } = metric;

      if (!groupedMetrics[category]) {
        groupedMetrics[category] = [];
      }

      groupedMetrics[category].push(metric);
      return groupedMetrics;
    },
    {},
  );
};

export const ChartMetrics = ({
  appliedMetrics,
  setAppliedMetrics,
  allMetrics,
}: ChartMetricsProps) => {
  const handleRemoveMetric = (labelToRemove: string) => {
    setAppliedMetrics((prev) => {
      const metrics = {
        ...prev,
      };
      const metricToRemove = Object.keys(metrics).find(
        (key) => metrics[key].label === labelToRemove,
      );

      if (metricToRemove) {
        delete metrics[metricToRemove];
      }

      return metrics;
    });
  };

  const handleApplyMetric = (newMetrics: Metric[]) => {
    setAppliedMetrics((prev) => {
      const metrics = {
        ...prev,
      };

      newMetrics.forEach((metric) => {
        const newMetricKey = Object.keys(allMetrics).find(
          (key) => allMetrics[key].label === metric.label,
        );

        if (!newMetricKey) return;

        metrics[newMetricKey] = metric;
      });

      return metrics;
    });
  };

  const appliedMetricsFormatted = formatMetricsByCategory(
    Object.values(appliedMetrics),
  );
  const allMetricsFormatted = formatMetricsByCategory(
    Object.values(allMetrics),
  );

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
                  <div
                    key={metric.label}
                    className="border-light-dark flex h-7 w-full cursor-default items-center justify-between gap-2 rounded-sm border px-2 hover:opacity-80"
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
                    <Button
                      variant={"ghost"}
                      onClick={() => handleRemoveMetric(metric.label)}
                      className="cursor-pointer p-0"
                    >
                      <X className="text-secondary" />
                    </Button>
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
        <div className="from-surface-default pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t to-transparent" />
      </div>
      <ChartMetricsDialog
        appliedMetrics={appliedMetricsFormatted}
        allMetrics={allMetricsFormatted}
        onApply={handleApplyMetric}
      />
    </div>
  );
};
