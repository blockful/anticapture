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
  inputType = "text",
  setFilter,
  initialMin = "",
  initialMax = "",
}: FilterMaxMinInputProps) => {
  const [minValue, setMinValue] = useState<string>(initialMin);
  const [maxValue, setMaxValue] = useState<string>(initialMax);

  useEffect(() => {
    setMinValue(initialMin);
  }, [initialMin]);

  useEffect(() => {
    setMaxValue(initialMax);
  }, [initialMax]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite números, teclas de navegação e edição
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

    // Permite teclas especiais, números, e ponto decimal
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
    setFilter(minValue, maxValue);
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
            onBlur={handleBlur}
            className={cn(
              "bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none",
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
            onBlur={handleBlur}
            className={cn(
              "bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none",
            )}
          />
        </div>
      </div>
    </div>
  );
};
