"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/client/utils";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { ChevronDown, CheckIcon } from "lucide-react";

interface SwitcherChartProps {
  setMetric: (metric: string) => void;
  defaultValue: string;
  options: string[];
}

export const SwitcherChart = ({
  setMetric,
  defaultValue,
  options,
}: SwitcherChartProps) => {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<string>(defaultValue);

  const handleSelect = (value: string) => {
    setIsSelected(value);
    setMetric(value);
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
          "flex items-center gap-1 rounded-lg border px-2 py-1 text-white transition-all duration-200",
          isOpen
            ? "border-tangerine bg-[#26262A]"
            : "border-transparent bg-lightDark",
        )}
      >
        <span className="whitespace-nowrap text-sm font-medium">
          {isSelected}
        </span>
        <ChevronDown
          className={cn(
            "size-3 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-white/10 bg-[#27272A] py-1 text-white">
          {Object.values(options).map((metrics) => (
            <button
              key={metrics}
              className={cn(
                "flex w-full items-center justify-between gap-1.5 whitespace-nowrap px-3 py-2 text-left text-sm font-normal text-[#FAFAFA] hover:bg-[#26262A]",
                isSelected == metrics && "bg-middleDark",
              )}
              onClick={() => handleSelect(metrics)}
            >
              {metrics}
              {isSelected == metrics && (
                <CheckIcon className="size-3.5 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <Tabs defaultValue={defaultValue} className="flex gap-1 rounded-md">
      <TabsList>
        {options.map((option) => (
          <TabsTrigger
            className="px-3 py-0.5 text-sm font-normal"
            key={option}
            value={option}
            onClick={() => setMetric(option)}
          >
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
