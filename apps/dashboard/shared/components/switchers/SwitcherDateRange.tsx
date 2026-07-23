"use client";

import { CalendarIcon, CheckIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/shared/components/ui/calendar";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useScreenSize } from "@/shared/hooks";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { cn } from "@/shared/utils/";

export const MAX_PERIOD = "max";
export const CUSTOM_PERIOD = "custom";

export type DatePeriod = TimeInterval | typeof MAX_PERIOD;

interface SwitcherDateRangeProps {
  selected: string;
  onSelectPeriod: (period: DatePeriod) => void;
  customRange?: { from?: Date; to?: Date };
  onSelectCustomRange: (range: { from: Date; to: Date }) => void;
  disableRecentData?: boolean;
}

const formatOption = (option: DatePeriod) => {
  if (option === MAX_PERIOD) return "MAX";
  if (option === TimeInterval.ONE_YEAR) return "1Y";
  return option.toUpperCase();
};

export const SwitcherDateRange = ({
  selected,
  onSelectPeriod,
  customRange,
  onSelectCustomRange,
  disableRecentData = false,
}: SwitcherDateRangeProps) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    customRange?.from && customRange?.to
      ? { from: customRange.from, to: customRange.to }
      : undefined,
  );

  const intervals = Object.values(TimeInterval).filter(
    (interval) =>
      !disableRecentData ||
      (interval !== TimeInterval.SEVEN_DAYS &&
        interval !== TimeInterval.THIRTY_DAYS),
  );
  const options: DatePeriod[] = [...intervals, MAX_PERIOD];

  const handleRangeSelect = (range: DateRange | undefined) => {
    setPendingRange(range);
    if (
      range?.from &&
      range?.to &&
      range.from.getTime() !== range.to.getTime()
    ) {
      onSelectCustomRange({ from: range.from, to: range.to });
      setIsCalendarOpen(false);
    }
  };

  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const calendarButton = (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <IconButton
          icon={CalendarIcon}
          variant="outline"
          aria-label="Select custom date range"
          iconClassName="size-4"
          className={cn(
            "rounded-base !h-auto w-10 self-stretch",
            selected === CUSTOM_PERIOD || isCalendarOpen
              ? "border-tangerine text-primary"
              : "border-light-dark text-secondary hover:text-primary",
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          defaultMonth={pendingRange?.from ?? previousMonth}
          selected={pendingRange}
          onSelect={handleRangeSelect}
          disabled={{ after: now }}
          classNames={{
            // Match the Figma H&D calendar: selected days use a white pill
            // with dark text (the shared default is the orange action color).
            selected:
              "bg-primary text-inverted [&>button]:text-inverted hover:bg-primary focus:bg-primary rounded-md",
            range_start: "day-range-start rounded-l-md",
            range_end: "day-range-end rounded-r-md",
            range_middle: "bg-surface-contrast text-primary rounded-none",
          }}
        />
      </PopoverContent>
    </Popover>
  );

  return isMobile ? (
    <div className="flex items-center gap-1">
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
          aria-controls="datePeriod-value"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "text-primary flex min-w-[49px] cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 transition-all duration-200",
            isOpen
              ? "border-tangerine bg-[#26262A]"
              : "bg-surface-contrast border-transparent",
          )}
        >
          <span className="text-sm font-medium">
            {selected === CUSTOM_PERIOD
              ? "Custom"
              : formatOption(selected as DatePeriod)}
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
            {options.map((option) => (
              <button
                key={option}
                className={cn(
                  "text-primary flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm font-normal hover:bg-[#26262A]",
                  selected === option && "bg-middle-dark",
                )}
                onClick={() => {
                  onSelectPeriod(option);
                  setIsOpen(false);
                }}
              >
                {formatOption(option)}
                {selected === option && <CheckIcon className="size-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {calendarButton}
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <Tabs
        value={selected === CUSTOM_PERIOD ? "" : selected}
        className="gap-1"
      >
        <TabsList className="rounded-base">
          {options.map((option) => (
            <TabsTrigger
              key={option}
              className="min-w-[60px] cursor-pointer px-3 py-1.5 text-sm font-medium"
              value={option}
              onClick={() => onSelectPeriod(option)}
            >
              {formatOption(option)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {calendarButton}
    </div>
  );
};
