"use client";

import { useState, useEffect } from "react";
import { cn } from "@/shared/utils";
import { RadioButton } from "@/shared/components/design-system/buttons/RadioButton";

export interface SortOption {
  value: string;
  label: string;
}

interface FilterSortProps {
  title?: string;
  options: SortOption[];
  setFilter: (sortOrder: string) => void;
  initialValue?: string;
}

export const FilterSort = ({
  title = "Sort",
  options,
  setFilter,
  initialValue,
}: FilterSortProps) => {
  const [sortOrder, setSortOrder] = useState<string>(initialValue || "");

  useEffect(() => {
    if (initialValue !== undefined) {
      setSortOrder(initialValue);
    }
  }, [initialValue]);

  const handleSortChange = (value: string) => {
    const newValue = sortOrder === value ? "" : value;
    setSortOrder(newValue);
    setFilter(newValue);
  };

  return (
    <div className="px-3">
      <div className="flex px-0 py-2">
        <h4 className="text-secondary font-mono text-xs font-medium uppercase tracking-wider">
          {title}
        </h4>
      </div>

      <div className="flex w-full gap-1">
        {options.map((option) => (
          <RadioButton
            className={cn(
              "bg-surface-default text-primary border-border-contrast flex w-full cursor-pointer items-center gap-2 whitespace-nowrap border px-2.5 py-2 text-sm font-normal leading-5 transition-all",
              sortOrder === option.value && "border-highlight",
            )}
            label={option.label}
            checked={sortOrder === option.value}
            onClick={() => handleSortChange(option.value)}
            key={option.value}
          />
        ))}
      </div>
    </div>
  );
};
