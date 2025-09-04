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
    setFilter(sortOrder);
  }, [sortOrder, setFilter]);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
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
              "bg-surface-default text-primary border-border-contrast flex items-center justify-between text-nowrap rounded-md border px-2.5 py-2 text-sm font-normal transition-all",
              sortOrder === option.value && "bg-surface-hover",
            )}
          >
            <span>{option.label}</span>
            <RadioButton
              label=""
              className="flex"
              checked={sortOrder === option.value}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
