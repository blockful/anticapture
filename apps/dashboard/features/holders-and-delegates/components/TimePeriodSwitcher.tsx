"use client";

import { CheckIcon, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { useScreenSize } from "@/shared/hooks";
import { cn } from "@/shared/utils/";

export type TimePeriod = "30d" | "90d" | "all";

interface TimePeriodSwitcherProps {
  setTimePeriod: (timePeriod: TimePeriod) => void;
  value: TimePeriod;
  isSmall?: boolean;
}

export const TimePeriodSwitcher = ({
  setTimePeriod,
  value,
  isSmall = false,
}: TimePeriodSwitcherProps) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const activeTimePeriods: TimePeriod[] = ["30d", "90d", "all"];

  const handleSelect = (period: TimePeriod) => {
    setTimePeriod(period);
    setIsOpen(false);
  };

  const formatPeriod = (period: TimePeriod) =>
    period === "all" ? "Max available data" : period;

  return isMobile ? (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Button
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="timePeriod-value"
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className={cn(
          "min-w-[70px]",
          isOpen
            ? "border-tangerine bg-light-dark"
            : "bg-surface-contrast border-transparent",
        )}
      >
        <span className="text-sm font-medium">{formatPeriod(value)}</span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </Button>

      {isOpen && (
        <div className="border-border-contrast bg-surface-contrast absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border py-1">
          {activeTimePeriods.map((period) => (
            <Button
              key={period}
              variant="ghost"
              className={cn("text-left", {
                "bg-middle-dark": value == period,
              })}
              onClick={() => handleSelect(period)}
            >
              {formatPeriod(period)}
              {value == period && <CheckIcon className="size-3.5" />}
            </Button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <SegmentedControl
      value={value}
      size={isSmall ? "sm" : "md"}
      items={activeTimePeriods.map((period) => ({
        value: period,
        label: formatPeriod(period),
      }))}
      onValueChange={(period) => setTimePeriod(period as TimePeriod)}
    />
  );
};
