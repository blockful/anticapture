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
  const [sortOrder, setSortOrder] = useState<string>(
    initialValue || options[0]?.value || "",
  );

  useEffect(() => {
    if (initialValue !== undefined) {
      setSortOrder(initialValue);
    }
  }, [initialValue]);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    setFilter(value);
  };

  return (
    <div className="px-3 pb-3">
      <div className="flex px-0 py-2">
        <h4 className="text-secondary text-alternative-xs font-medium uppercase">
          {title}
        </h4>
      </div>

      <div className="flex w-full gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={cn(
              "bg-surface-default text-primary border-border-contrast flex w-full items-center text-nowrap rounded-md border px-2.5 py-2 text-sm font-normal transition-all",
              sortOrder === option.value && "bg-surface-hover",
            )}
          >
            <p className="flex-1 text-left">{option.label}</p>
            <div className="ml-auto">
              <RadioButton label="" checked={sortOrder === option.value} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
