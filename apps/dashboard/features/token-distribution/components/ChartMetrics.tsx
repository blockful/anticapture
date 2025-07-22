import * as React from "react";
import { CardTitle } from "@/shared/components/ui/card";
import { X } from "lucide-react";
import { ChartMetricsDialog } from "@/features/token-distribution/components";

interface Metric {
  // TODO: move to shared when type is known
  color: string;
  label: string;
  category: string;
}

const INITIAL_METRICS = [
  { label: "Delegated Supply", color: "#3B82F6", category: "SUPPLY" },
  { label: "CEX Supply", color: "#FB923C", category: "SUPPLY" },
  { label: "DEX Supply", color: "#22C55E", category: "SUPPLY" },
  { label: "Lending Supply", color: "#A855F7", category: "SUPPLY" },
];

export const ChartMetrics = () => {
  const [appliedMetrics, setAppliedMetrics] =
    React.useState<Metric[]>(INITIAL_METRICS);

  const metricsByCategory = React.useMemo(() => {
    return appliedMetrics.reduce<Record<string, Metric[]>>((acc, metric) => {
      acc[metric.category] = acc[metric.category] || [];
      acc[metric.category].push(metric);
      return acc;
    }, {});
  }, [appliedMetrics]);

  const handleRemoveMetric = (label: string) => {
    setAppliedMetrics((prev) =>
      prev.filter((metric) => metric.label !== label),
    );
  };

  const handleApplyMetric = (newMetrics: Metric[]) => {
    setAppliedMetrics((prev) => [...prev, ...newMetrics]);
  };

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="relative flex h-full w-full flex-col gap-4 sm:gap-6">
        <div className="scrollbar-none flex max-h-96 flex-col gap-2 overflow-y-auto">
          {Object.entries(metricsByCategory).map(([category, metrics]) => (
            <div key={category} className="mb-4 flex flex-col gap-2">
              <CardTitle className="!text-alternative-sm text-secondary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                {category}
              </CardTitle>
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="border-light-dark flex w-full cursor-default items-center justify-between gap-2 rounded-sm border px-2 py-1 hover:opacity-80"
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
                  <button
                    onClick={() => handleRemoveMetric(metric.label)}
                    className="cursor-pointer"
                  >
                    <X className="text-secondary h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="from-surface-default pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t to-transparent" />
      </div>
      <ChartMetricsDialog
        appliedMetrics={appliedMetrics}
        onApply={handleApplyMetric}
      />
    </div>
  );
};
