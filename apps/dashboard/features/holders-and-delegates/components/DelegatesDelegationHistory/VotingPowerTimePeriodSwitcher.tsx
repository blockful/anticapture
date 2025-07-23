"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/";
import { useScreenSize } from "@/shared/hooks";
import { CheckIcon, ChevronDown } from "lucide-react";

export type VotingPowerTimePeriod = "30d" | "90d" | "all";

interface VotingPowerTimePeriodSwitcherProps {
  setTimePeriod: (timePeriod: VotingPowerTimePeriod) => void;
  value: VotingPowerTimePeriod;
  isSmall?: boolean;
}

export const VotingPowerTimePeriodSwitcher = ({
  setTimePeriod,
  value,
  isSmall = false,
}: VotingPowerTimePeriodSwitcherProps) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const activeTimePeriods: VotingPowerTimePeriod[] = ["30d", "90d", "all"];

  const handleSelect = (period: VotingPowerTimePeriod) => {
    setTimePeriod(period);
    setIsOpen(false);
  };

  const formatPeriod = (period: VotingPowerTimePeriod) =>
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
      <button
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="timePeriod-value"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "text-primary flex min-w-[70px] cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 transition-all duration-200",
          isOpen
            ? "border-tangerine bg-light-dark"
            : "bg-surface-contrast border-transparent",
        )}
      >
        <span className="font-medium- text-sm">{formatPeriod(value)}</span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="border-border-contrast bg-surface-contrast absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border py-1">
          {activeTimePeriods.map((period) => (
            <button
              key={period}
              className={cn(
                "text-primary hover:bg-surface-hover flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm font-normal",
                value == period && "bg-middle-dark",
              )}
              onClick={() => handleSelect(period)}
            >
              {formatPeriod(period)}
              {value == period && <CheckIcon className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <Tabs value={value} className="gap-1">
      <TabsList>
        {activeTimePeriods.map((period) => (
          <TabsTrigger
            key={period}
            className={cn(
              "cursor-pointer text-sm font-medium",
              isSmall
                ? "min-w-[60px] px-1.5 py-0.5"
                : "min-w-[84px] px-3 py-1.5",
            )}
            value={period}
            onClick={() => setTimePeriod(period)}
          >
            {formatPeriod(period)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
