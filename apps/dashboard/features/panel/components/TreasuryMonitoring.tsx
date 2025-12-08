"use client";

import { TooltipInfo } from "@/shared/components";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { formatNumberUserReadable } from "@/shared/utils";

// Fake data for now
const monitoringData = [
  {
    title: "Treasury: Monitored vs Ecosystem total",
    tooltip:
      "Represents the funds held in DAO treasuries. The first value shows treasuries from DAOs monitored by Anticapture; the second shows the total across the ecosystem.",
    current: 4100000000, // $4.1B
    total: 16200000000, // $16.2B
    percentage: 25,
  },

  // Fake data for now
  {
    title: "TVL: Monitored vs Ecosystem Total",
    tooltip:
      "Represents the total value locked in DAO contracts. The first value reflects DAOs monitored by Anticapture; the second shows the ecosystem-wide total.",
    current: 5600000000, // $5.6B
    total: 35100000000, // $35.1B
    percentage: 16,
  },
];

export const TreasuryMonitoring = () => {
  return (
    <div className="bg-surface-default flex w-full flex-col gap-4 p-4">
      <div className="flex flex-col gap-3">
        {monitoringData.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-[20px] tracking-[0.78px]">
                {item.title}
              </h3>

              <TooltipInfo text={item.tooltip} />
            </div>

            <div className="flex flex-col">
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
        text="Only a portion of the ecosystem's funds is monitored by Anticapture, which means some risks may not be detected yet."
        variant="error"
      />
    </div>
  );
};
