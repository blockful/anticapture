"use client";

import { useEffect } from "react";
import {
  FilterBox,
  FilterMaxMinInput,
  FilterSort,
  SortOption,
} from "@/shared/components/design-system/table/filters/amount-filter/components";
import {
  useAmountFilterStore,
  AmountFilterState,
} from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";

interface AmountFilterProps {
  className?: string;
  onApply: (state: AmountFilterState) => void;
  onReset: () => void;
  isActive?: boolean;
  sortOptions: SortOption[];
}

export const AmountFilter = ({
  className,
  onApply,
  onReset,
  isActive = false,
  sortOptions,
}: AmountFilterProps) => {
  const {
    minAmount,
    maxAmount,
    sortOrder,
    setMinAmount,
    setMaxAmount,
    setSortOrder,
    reset,
    initialize,
    getState,
  } = useAmountFilterStore();

  // Inicializar a store com o sortOrder padrão
  useEffect(() => {
    if (sortOptions[0]?.value && sortOrder === "") {
      initialize(sortOptions[0].value);
    }
  }, [sortOptions, sortOrder, initialize]);

  const handleMinMaxChange = (min: string, max: string) => {
    setMinAmount(min);
    setMaxAmount(max);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
  };

  const handleApply = () => {
    onApply(getState());
  };

  const handleReset = () => {
    reset(sortOptions[0]?.value || "");
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
