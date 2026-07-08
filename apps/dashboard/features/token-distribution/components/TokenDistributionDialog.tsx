"use client";

import { Plus, PlusIcon, Check } from "lucide-react";
import { useMemo, useState } from "react";

import type { MetricWithKey } from "@/features/token-distribution/types";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { cn } from "@/shared/utils/cn";

export const TokenDistributionDialog = ({
  appliedMetrics,
  metricsSchema,
  onApply,
  daoId,
}: {
  appliedMetrics: Record<string, MetricWithKey[]>;
  metricsSchema: Record<string, MetricWithKey[]>;
  onApply: (metric: (MetricTypesEnum | string)[]) => void;
  daoId: DaoIdEnum;
}) => {
  const notSupportedMetrics = useMemo(
    () => daoConfig[daoId].notSupportedMetrics ?? [],
    [daoId],
  );

  const [selectedMetrics, setSelectedMetrics] = useState<
    (MetricTypesEnum | string)[]
  >([]);
  const [open, setOpen] = useState(false);

  const handleSelectMetric = (metricKey: MetricTypesEnum | string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey],
    );
  };

  const handleApplyMetric = () => {
    onApply(selectedMetrics);
    setSelectedMetrics([]);
    setOpen(false);
  };

  const isAllMetricsApplied =
    appliedMetrics &&
    Object.entries(metricsSchema).every(
      ([category, metrics]) =>
        appliedMetrics[category]?.length === metrics.length,
    );

  const selectedMetricsSet = useMemo(
    () => new Set(selectedMetrics),
    [selectedMetrics],
  );
  const notSupportedMetricsSet = useMemo(
    () => new Set(notSupportedMetrics),
    [notSupportedMetrics],
  );

  return (
    <>
      <Button
        data-ph-event="metric_added"
        data-ph-source="token_distribution"
        data-umami-event="metric_added"
        variant="outline"
        disabled={isAllMetricsApplied}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isAllMetricsApplied ? (
          <>
            <Check className="text-dimmed size-3.5" />
            <p className="text-dimmed text-sm font-medium">All metrics added</p>
          </>
        ) : (
          <>
            <PlusIcon className="text-primary size-3.5" />
            <p className="text-primary text-sm font-medium">Add metric</p>
          </>
        )}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add metrics to chart"
        cancelLabel="Cancel"
        confirmLabel="Apply metrics"
        onConfirm={handleApplyMetric}
        className="max-w-[520px]"
      >
        <div className="flex flex-col">
          {Object.entries(metricsSchema)
            .filter(
              ([category, metrics]) =>
                appliedMetrics[category]?.length !== metrics.length,
            )
            .map(([category, metrics], index, visibleEntries) => {
              return (
                <div key={category}>
                  <h3 className="!text-alternative-sm text-secondary mb-1.5 flex items-center font-mono font-medium uppercase tracking-wide lg:gap-2.5">
                    {category}
                  </h3>
                  <div className="flex w-full flex-wrap gap-2 lg:gap-3">
                    {metrics.map((metric) => {
                      const isMetricAlreadyApplied = appliedMetrics[
                        category
                      ]?.some((i) => i.key === metric.key);

                      const isSelected = selectedMetricsSet.has(metric.key);

                      if (isMetricAlreadyApplied) return null;

                      return (
                        <Button
                          key={metric.label}
                          onClick={() => handleSelectMetric(metric.key)}
                          className={cn(
                            "bg-light-dark hover:bg-middle-dark text-primary flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2 py-1 text-sm",
                            isSelected
                              ? "border-tangerine"
                              : "border-transparent",
                          )}
                          disabled={notSupportedMetricsSet.has(
                            metric.key as MetricTypesEnum,
                          )}
                        >
                          {isSelected ? (
                            <Check className="size-3" />
                          ) : (
                            <Plus className="size-3" />
                          )}
                          {metric.label}
                        </Button>
                      );
                    })}
                  </div>
                  {visibleEntries.length > 1 &&
                    index !== visibleEntries.length - 1 && (
                      <div className="border-light-dark my-4 h-px w-full border-t border-dashed" />
                    )}
                </div>
              );
            })}
        </div>
      </Modal>
    </>
  );
};
