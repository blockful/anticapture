"use client";

import { useState } from "react";
import {
  FilterBox,
  FilterMaxMinInput,
  FilterSort,
  SortOption,
} from "@/shared/components/design-system/table/filters/amount-filter/components";

export interface AmountFilterState {
  minAmount: string;
  maxAmount: string;
  sortOrder: string;
}

interface AmountFilterProps {
  className?: string;
  onApply: (state: AmountFilterState) => void;
  onReset: () => void;
  initialState?: Partial<AmountFilterState>;
  isActive?: boolean;
  sortOptions: SortOption[];
}

export const AmountFilter = ({
  className,
  onApply,
  onReset,
  initialState = {},
  isActive = false,
  sortOptions,
}: AmountFilterProps) => {
  const [minAmount, setMinAmount] = useState(initialState.minAmount || "");
  const [maxAmount, setMaxAmount] = useState(initialState.maxAmount || "");
  const [sortOrder, setSortOrder] = useState(
    initialState.sortOrder || sortOptions[0]?.value || "",
  );

  const handleMinMaxChange = (min: string, max: string) => {
    setMinAmount(min);
    setMaxAmount(max);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
  };

  const handleApply = () => {
    const filterState: AmountFilterState = {
      minAmount,
      maxAmount,
      sortOrder,
    };

    onApply(filterState);
  };

  const handleReset = () => {
    setMinAmount("");
    setMaxAmount("");
    setSortOrder(sortOptions[0]?.value || "");
    onReset();
  };

  const validator = (value: string) => {
    if (!value.trim()) return true;
    // Aceita APENAS dígitos de 0-9
    const onlyDigitsRegex = /^[0-9]+$/;
    return onlyDigitsRegex.test(value);
  };

  return (
    <FilterBox
      className={className}
      headerTitle="Custom Amount"
      buttonTitle="Apply"
      resetTitle="Reset"
      isActive={isActive}
      onApply={handleApply}
      onReset={handleReset}
    >
      <FilterMaxMinInput
        placeholderMin="Min"
        placeholderMax="Max"
        inputType="text"
        validator={validator}
        setFilter={handleMinMaxChange}
        initialMin={minAmount}
        initialMax={maxAmount}
      />
      <div className="border-border-contrast border-b" />
      <FilterSort
        title="Sort"
        options={sortOptions}
        setFilter={handleSortChange}
        initialValue={sortOrder}
      />
    </FilterBox>
  );
};
