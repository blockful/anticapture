import {
  Close,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from "@radix-ui/react-dialog";
import { CardTitle } from "@/shared/components/ui/card";
import { X, Plus, PlusIcon } from "lucide-react";
import React from "react";

interface Metric {
  // TODO: move to shared when type is known
  color: string;
  label: string;
  category: string;
}

const MOCKED_METRICS = [
  {
    name: "SUPPLY",
    metrics: [
      { label: "Delegated Supply", color: "#3B82F6" },
      { label: "CEX Supply", color: "#FB923C" },
      { label: "DEX Supply", color: "#22C55E" },
      { label: "Lending Supply", color: "#A855F7" },
    ],
  },
  {
    name: "TRANSFERS VOLUME",
    metrics: [
      { label: "DEX Tokens", color: "#22C55E" },
      { label: "Lending Tokens", color: "#A855F7" },
    ],
  },
  {
    name: "GOVERNANCE",
    metrics: [
      { label: "Proposals", color: "#FB923C" },
      { label: "Voting Volume", color: "#3B82F6" },
      { label: "Treasury", color: "#A855F7" },
    ],
  },
  {
    name: "MARKET",
    metrics: [{ label: "Token Price", color: "#3B82F6" }],
  },
];

export const ChartMetricsDialog = ({
  appliedMetrics,
  onApply,
}: {
  appliedMetrics: Metric[];
  onApply: (items: Metric[]) => void;
}) => {
  const [selectedItems, setSelectedItems] = React.useState<Metric[]>([]);

  const handleToggle = (metric: Metric) => {
    setSelectedItems((prev) => {
      const exists = prev.find((m) => m.label === metric.label);
      if (exists) return prev.filter((m) => m.label !== metric.label);
      return [...prev, metric];
    });
  };

  const isSelected = (metric: Metric) =>
    selectedItems.some((m) => m.label === metric.label);

  const handleApplyMetric = () => {
    onApply(selectedItems);
    setSelectedItems([]);
  };

  return (
    <Root>
      <Trigger asChild>
        <button className="border-light-dark mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border px-2 py-1 hover:opacity-80">
          <PlusIcon className="text-primary h-3 w-3" />
          <span className="text-primary text-sm font-medium">Add metrics</span>
        </button>
      </Trigger>
      <Portal>
        <Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Content className="z-60 bg-surface-default fixed left-1/2 top-1/2 max-h-[85vh] w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-md shadow-lg">
          <Title className="text-primary m-0 px-4 py-3.5 text-[17px] font-medium">
            Add metrics to chart
          </Title>
          <div className="border-light-dark h-px w-full border-t" />
          <Description className="flex flex-col px-4 pt-4">
            {MOCKED_METRICS.map((item, index) => (
              <div key={item.name} className="mb-4">
                <CardTitle className="!text-alternative-sm text-secondary mb-1.5 flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                  {item.name}
                </CardTitle>
                <div className="flex w-full flex-wrap gap-2 sm:gap-3">
                  {item.metrics.map((metric) => {
                    const isAlreadyApplied = appliedMetrics.some(
                      (i) => i.label === metric.label,
                    );
                    if (isAlreadyApplied) return null;
                    const itemWithCategory = { ...metric, category: item.name };
                    return (
                      <div
                        key={metric.label}
                        onClick={() => handleToggle(itemWithCategory)}
                        className={`border-light-dark flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2 py-1 text-sm hover:opacity-80 ${
                          isSelected(itemWithCategory)
                            ? "bg-white text-black"
                            : "text-primary"
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        {metric.label}
                      </div>
                    );
                  })}
                </div>
                {index !== MOCKED_METRICS.length - 1 && (
                  <div className="border-light-dark mt-4 h-px w-full border-t border-dashed" />
                )}
              </div>
            ))}
          </Description>
          <div className="border-light-dark h-px w-full border-t" />
          <div className="flex justify-end gap-2 px-4 py-3">
            <Close asChild>
              <button className="text-primary bg-surface-default border-light-dark flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium">
                Cancel
              </button>
            </Close>
            <Close asChild>
              <button
                onClick={handleApplyMetric}
                className="text-inverted flex cursor-pointer items-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium"
              >
                Apply metrics
              </button>
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
