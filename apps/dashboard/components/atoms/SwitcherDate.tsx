"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/client/utils";
import { TimeInterval } from "@/lib/enums/TimeInterval";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { CheckIcon, ChevronDown } from "lucide-react";

export const SwitcherDate = ({
  setTimeInterval,
  defaultValue,
}: {
  setTimeInterval: (timeInterval: TimeInterval) => void;
  defaultValue: TimeInterval;
}) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<TimeInterval>(defaultValue);

  const handleSelect = (value: TimeInterval) => {
    setIsSelected(value);
    setTimeInterval(value);
    setIsOpen(false);
  };

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
          "flex min-w-[49px] items-center gap-1 rounded-lg border px-2 py-1 text-white transition-all duration-200",
          isOpen
            ? "border-tangerine bg-[#26262A]"
            : "border-transparent bg-lightDark",
        )}
      >
        <span className="font-medium- text-sm">{isSelected}</span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-white/10 bg-[#1C1C1F] py-1">
          {Object.values(TimeInterval).map((interval) => (
            <button
              key={interval}
              className={cn(
                "flex w-full items-center justify-between gap-1.5 px-3 py-2 text-left text-sm font-normal text-[#FAFAFA] hover:bg-[#26262A]",
                isSelected == interval && "bg-middleDark",
              )}
              onClick={() => handleSelect(interval)}
            >
              {interval === TimeInterval.ONE_YEAR ? "1y" : interval}
              {isSelected == interval && <CheckIcon className="size-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.SEVEN_DAYS}
          onClick={() => setTimeInterval(TimeInterval.SEVEN_DAYS)}
        >
          {TimeInterval.SEVEN_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.THIRTY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.THIRTY_DAYS)}
        >
          {TimeInterval.THIRTY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.NINETY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.NINETY_DAYS)}
        >
          {TimeInterval.NINETY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.ONE_YEAR}
          onClick={() => setTimeInterval(TimeInterval.ONE_YEAR)}
        >
          1y
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
