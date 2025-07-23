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

// TODO: move to shared when types is known
interface Metric {
  color: string;
  label: string;
  category: string;
}

export const ChartMetricsDialog = ({
  appliedMetrics,
  allMetrics,
  onApply,
}: {
  appliedMetrics: Record<string, Metric[]>;
  allMetrics: Record<string, Metric[]>;
  onApply: (items: Metric[]) => void;
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>([]);

  const handleSelectMetric = (metric: Metric) => {
    setSelectedMetrics((prev) => {
      const exists = prev.find((m) => m.label === metric.label);
      if (exists) return prev.filter((m) => m.label !== metric.label);
      return [...prev, metric];
    });
  };

  const handleApplyMetric = () => {
    onApply(selectedMetrics);
    setSelectedMetrics([]);
  };

  const isAllMetricsApplied =
    appliedMetrics &&
    Object.entries(allMetrics).some(
      ([category, metrics]) =>
        appliedMetrics[category]?.length === metrics.length,
    );

  return (
    <Root>
      <Trigger asChild>
        <Button
          variant={isAllMetricsApplied ? "disabled" : "ghost"}
          className={cn(
            "border-light-dark mt-4 flex h-7 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border px-2 hover:opacity-80",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={isAllMetricsApplied}
        >
          <PlusIcon className="text-primary" />
          <span className="text-primary text-sm font-medium">Add metrics</span>
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
            {Object.entries(allMetrics).map(([category, metrics], index) => {
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
                        (i) => i.label === metric.label,
                      );

                      const isSelected = selectedMetrics.some(
                        (m) => m.label === metric.label,
                      );

                      if (isAlreadyApplied) return null;

                      return (
                        <div
                          key={metric.label}
                          onClick={() => handleSelectMetric(metric)}
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
                  {index !== Object.keys(allMetrics).length - 1 && (
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
                variant={"ghost"}
                className="text-primary bg-surface-default border-light-dark flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
            </Close>
            <Close asChild>
              <Button
                variant={"ghost"}
                onClick={handleApplyMetric}
                className="text-inverted flex cursor-pointer items-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium"
              >
                Apply metrics
              </Button>
            </Close>
          </div>

          <Close asChild>
            <button
              className="text-primary focus:ring-primary absolute right-4 top-3.5 inline-flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-1"
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
