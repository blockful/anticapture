"use client";

import { useState, useEffect } from "react";
import { cn } from "@/shared/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";

interface FilterMaxMinInputProps {
  title?: string;
  placeholderMin?: string;
  placeholderMax?: string;
  inputType?: "text" | "number";
  setFilter: (min: string, max: string) => void;
  initialMin?: string;
  initialMax?: string;
}

export const FilterMaxMinInput = ({
  title,
  placeholderMin = "Min",
  placeholderMax = "Max",
  setFilter,
  initialMin = "",
  initialMax = "",
}: FilterMaxMinInputProps) => {
  const [minValue, setMinValue] = useState<string>(initialMin);
  const [maxValue, setMaxValue] = useState<string>(initialMax);

  const formatNumber = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, "");

    if (!cleanValue) return "";

    const parts = cleanValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
    }

    return formattedInteger;
  };

  const unformatNumber = (value: string): string => {
    return value.replace(/,/g, "");
  };

  useEffect(() => {
    setMinValue(formatNumber(initialMin));
  }, [initialMin]);

  useEffect(() => {
    setMaxValue(formatNumber(initialMax));
  }, [initialMax]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = unformatNumber(e.target.value);
    const formatted = formatNumber(rawValue);
    setMinValue(formatted);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = unformatNumber(e.target.value);
    const formatted = formatNumber(rawValue);
    setMaxValue(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Clear",
      "Copy",
      "Paste",
      "Cut",
      "Select",
      "SelectAll",
    ];

    if (
      allowedKeys.includes(e.key) ||
      /^[0-9.]$/.test(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    e.preventDefault();
  };

  const handleBlur = () => {
    const cleanMin = unformatNumber(minValue);
    const cleanMax = unformatNumber(maxValue);
    setFilter(cleanMin, cleanMax);
  };

  const inputClassName =
    "w-28 bg-surface-default border-border-contrast text-primary placeholder:text-dimmed h-9 w-full border px-2.5 py-2 text-sm font-normal leading-5 transition-colors focus:outline-none";

  return (
    <div className="border-border-contrast flex items-center gap-1 overflow-hidden border-b px-3 pb-3">
      {title && (
        <div className="flex px-0 py-2">
          <h4 className="text-secondary font-mono text-xs font-medium uppercase tracking-wider">
            {title}
          </h4>
        </div>
      )}
      <div className="flex flex-1 items-center gap-1">
        <div className="flex-1">
          <input
            type="text"
            placeholder={placeholderMin}
            value={minValue}
            onChange={handleMinChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={inputClassName}
          />
        </div>
        <ArrowRightIcon className="text-dimmed size-3.5" />
        <div className="flex-1">
          <input
            type="text"
            placeholder={placeholderMax}
            value={maxValue}
            onChange={handleMaxChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={inputClassName}
          />
        </div>
      </div>
    </div>
  );
};
