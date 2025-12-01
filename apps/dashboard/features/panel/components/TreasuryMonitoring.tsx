"use client";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { formatNumberUserReadable } from "@/shared/utils";

// Fake data for now
const monitoringData = [
  {
    title: "Total Treasury monitored",
    current: 4100000000, // $4.1B
    total: 16200000000, // $16.2B
    percentage: 25,
  },

  // Fake data for now
  {
    title: "Total Value Locked (TVL) Monitored",
    current: 5600000000, // $5.6B
    total: 35100000000, // $35.1B
    percentage: 16,
  },
];

export const TreasuryMonitoring = () => {
  return (
    <div className="bg-surface-default flex w-full flex-col gap-4 rounded-lg p-4">
      <div className="flex flex-col gap-3">
        {monitoringData.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-[20px] tracking-[0.78px]">
              {item.title}
            </h3>
            <div className="flex flex-col gap-1">
              {/* Value display */}
              <div className="flex items-end gap-1">
                <p className="text-primary font-mono text-2xl font-normal uppercase leading-[32px]">
                  {formatNumberUserReadable(item.current)}
                </p>
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
                  / {formatNumberUserReadable(item.total)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex h-5 items-center gap-1">
                <div className="bg-surface-hover relative h-1 flex-1 overflow-hidden">
                  <div
                    className="bg-error h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-error text-sm font-normal leading-[20px]">
                  {item.percentage}%
                </p>
              </div>
            </div>
            {index < monitoringData.length - 1 && (
              <div className="bg-border-contrast h-px w-full" />
            )}
          </div>
        ))}
      </div>

      {/* Alert */}
      <InlineAlert
        text="More than $12.1B could be vulnerable without active monitoring"
        variant="error"
      />
    </div>
  );
};
