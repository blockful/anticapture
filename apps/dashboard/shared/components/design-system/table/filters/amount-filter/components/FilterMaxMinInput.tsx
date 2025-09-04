"use client";

import { useState, useEffect } from "react";
import { cn } from "@/shared/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";

interface FilterMaxMinInputProps {
  title?: string;
  placeholderMin?: string;
  placeholderMax?: string;
  inputType?: "text" | "number";
  validator?: (value: string) => boolean;
  setFilter: (min: string, max: string) => void;
  initialMin?: string;
  initialMax?: string;
}

export const FilterMaxMinInput = ({
  title,
  placeholderMin = "Min",
  placeholderMax = "Max",
  inputType = "text",
  validator,
  setFilter,
  initialMin = "",
  initialMax = "",
}: FilterMaxMinInputProps) => {
  const [minValue, setMinValue] = useState<string>(initialMin);
  const [maxValue, setMaxValue] = useState<string>(initialMax);

  useEffect(() => {
    setFilter(minValue, maxValue);
  }, [minValue, maxValue, setFilter]);

  const isValidInput = (value: string) => {
    if (!value.trim()) return true;
    if (validator) return validator(value);
    if (inputType === "number") {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    }
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Aceita APENAS números 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="px-3 pb-3">
      {title && (
        <div className="flex px-0 py-2">
          <h4 className="text-secondary text-alternative-xs font-medium uppercase">
            {title}
          </h4>
        </div>
      )}
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <input
            type={inputType}
            placeholder={placeholderMin}
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none",
              !isValidInput(minValue) && "border-red-500",
            )}
          />
        </div>
        <div className="text-dimmed">
          <ArrowRightIcon className="size-3.5" />
        </div>
        <div className="flex-1">
          <input
            type={inputType}
            placeholder={placeholderMax}
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none",
              !isValidInput(maxValue) && "border-red-500",
            )}
          />
        </div>
      </div>
    </div>
  );
};
