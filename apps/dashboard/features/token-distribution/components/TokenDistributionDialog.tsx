import {
  Close,
  Content,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from "@radix-ui/react-dialog";
import { CardTitle } from "@/shared/components/ui/card";
import { X, Plus, PlusIcon, Check } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { MetricWithKey } from "@/shared/dao-config/types";

export const TokenDistributionDialog = ({
  appliedMetrics,
  metricsSchema,
  onApply,
}: {
  appliedMetrics: Record<string, MetricWithKey[]>;
  metricsSchema: Record<string, MetricWithKey[]>;
  onApply: (metric: MetricTypesEnum[]) => void;
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricTypesEnum[]>([]);

  const handleSelectMetric = (metricKey: MetricTypesEnum) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey],
    );
  };

  const handleApplyMetric = () => {
    onApply(selectedMetrics);
    setSelectedMetrics([]);
  };

  const isAllMetricsApplied =
    appliedMetrics &&
    Object.entries(metricsSchema).every(
      ([category, metrics]) =>
        appliedMetrics[category]?.length === metrics.length,
    );

  return (
    <Root>
      <Trigger asChild>
        <Button
          variant={isAllMetricsApplied ? "disabled" : "ghost"}
          className={
            "border-light-dark mt-4 flex h-7 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border px-2 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          }
          disabled={isAllMetricsApplied}
        >
          {isAllMetricsApplied ? (
            <>
              <Check className="text-primary" />
              <span className="text-primary text-sm font-medium">
                All metrics added
              </span>
            </>
          ) : (
            <>
              {" "}
              <PlusIcon className="text-primary" />
              <span className="text-primary text-sm font-medium">
                Add metrics
              </span>
            </>
          )}
        </Button>
      </Trigger>
      <Portal>
        <Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Content className="z-60 fixed left-1/2 top-1/2 max-h-[85vh] w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#18181b] shadow-lg">
          <Title className="text-primary m-0 px-4 py-3.5 text-[17px] font-medium">
            Add metrics to chart
          </Title>
          <div className="border-light-dark h-px w-full border-t" />
          <div className="flex flex-col px-4 pt-4">
            {Object.entries(metricsSchema).map(([category, metrics], index) => {
              if (appliedMetrics[category]?.length === metrics.length)
                return null;

              return (
                <div key={category} className="mb-4">
                  <CardTitle className="!text-alternative-sm text-secondary mb-1.5 flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                    {category}
                  </CardTitle>
                  <div className="flex w-full flex-wrap gap-2 sm:gap-3">
                    {metrics.map((metric) => {
                      const isAlreadyApplied = appliedMetrics[category]?.some(
                        (i) => i.key === metric.key,
                      );

                      const isSelected = selectedMetrics.includes(metric.key);

                      if (isAlreadyApplied) return null;

                      return (
                        <div
                          key={metric.label}
                          onClick={() => handleSelectMetric(metric.key)}
                          className={cn(
                            `bg-light-dark hover:bg-middle-dark text-primary flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2 py-1 text-sm`,
                            isSelected
                              ? "border-tangerine"
                              : "border-transparent",
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {metric.label}
                        </div>
                      );
                    })}
                  </div>
                  {index !== Object.keys(metricsSchema).length - 1 && (
                    <div className="border-light-dark mt-4 h-px w-full border-t border-dashed" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-light-dark h-px w-full border-t" />
          <div className="flex justify-end gap-2 px-4 py-3">
            <Close asChild>
              <Button
                variant="ghost"
                className="text-primary bg-surface-default border-light-dark flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
            </Close>
            <Close asChild>
              <Button
                variant="ghost"
                onClick={handleApplyMetric}
                className="text-inverted flex cursor-pointer items-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium"
              >
                Apply metrics
              </Button>
            </Close>
          </div>

          <Close asChild>
            <button
              className="text-primary focus:ring-primary absolute right-4 top-3.5 inline-flex size-[25px] cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-1"
              aria-label="Close"
            >
              <X />
            </button>
          </Close>
        </Content>
      </Portal>
    </Root>
  );
};
