"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useScreenSize } from "@/shared/hooks";
import { CheckIcon, ChevronDown } from "lucide-react";

interface SwitcherDateProps {
  setTimeInterval: (timeInterval: TimeInterval) => void;
  defaultValue: TimeInterval;
  disableRecentData?: boolean; // If true, the 7 days and 30 days tabs will not be shown
  isSmall?: boolean;
}

export const SwitcherDate = ({
  setTimeInterval,
  defaultValue,
  disableRecentData = false,
  isSmall = false,
}: SwitcherDateProps) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<TimeInterval>(defaultValue);

  const activeTimeIntervals = useMemo(() => {
    const intervals = Object.values(TimeInterval);
    return disableRecentData
      ? intervals.filter(
          (interval) =>
            interval !== TimeInterval.SEVEN_DAYS &&
            interval !== TimeInterval.THIRTY_DAYS,
        )
      : intervals;
  }, [disableRecentData]);

  const handleSelect = (value: TimeInterval) => {
    setIsSelected(value);
    setTimeInterval(value);
    setIsOpen(false);
  };

  const formatInterval = (interval: TimeInterval) =>
    interval === TimeInterval.ONE_YEAR ? "1y" : interval;

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
        aria-controls="timeInterval-value"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "text-primary flex min-w-[49px] cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 transition-all duration-200",
          isOpen
            ? "border-tangerine bg-[#26262A]"
            : "bg-surface-contrast border-transparent",
        )}
      >
        <span className="font-medium- text-sm">
          {formatInterval(isSelected)}
        </span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-white/10 bg-[#1C1C1F] py-1">
          {activeTimeIntervals.map((interval) => (
            <button
              key={interval}
              className={cn(
                "text-primary flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm font-normal hover:bg-[#26262A]",
                isSelected == interval && "bg-middle-dark",
              )}
              onClick={() => handleSelect(interval)}
            >
              {formatInterval(interval)}
              {isSelected == interval && <CheckIcon className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <Tabs defaultValue={defaultValue} className="gap-1">
      <TabsList>
        {activeTimeIntervals.map((interval) => (
          <TabsTrigger
            key={interval}
            className={cn(
              "cursor-pointer text-sm font-medium",
              isSmall
                ? "min-w-[60px] px-1.5 py-0.5"
                : "min-w-[84px] px-3 py-1.5",
            )}
            value={interval}
            onClick={() => setTimeInterval(interval)}
          >
            {formatInterval(interval)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
