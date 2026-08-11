"use client";

import { useEffect } from "react";

import type { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import {
  FilterBox,
  FilterMaxMinInput,
  FilterSort,
} from "@/shared/components/design-system/table/filters/amount-filter/components";
import type { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { useAmountFilterStore } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";

interface AmountFilterProps {
  className?: string;
  onApply: (state: AmountFilterState) => void;
  onReset: () => void;
  isActive?: boolean;
  sortOptions?: SortOption[];
  filterId: string;
  /**
   * Applied range owned by the caller (URL/query state). The store is a module
   * singleton, so without this the inputs drift from the rows that are actually
   * filtered: stale values survive a tab switch, and a shared filtered URL opens
   * with blank inputs.
   */
  minValue?: string | null;
  maxValue?: string | null;
}

export const AmountFilter = ({
  className,
  onApply,
  onReset,
  isActive = false,
  sortOptions,
  filterId,
  minValue,
  maxValue,
}: AmountFilterProps) => {
  const store = useAmountFilterStore();
  // The setters are created once by `create`, so selecting them keeps the effect
  // deps stable. Depending on the whole store object would re-run the effect on
  // every write it performs — an update loop.
  const setMinAmount = useAmountFilterStore((s) => s.setMinAmount);
  const setMaxAmount = useAmountFilterStore((s) => s.setMaxAmount);

  const isControlled = minValue !== undefined || maxValue !== undefined;

  useEffect(() => {
    if (!isControlled) return;
    setMinAmount(filterId, minValue ?? "");
    setMaxAmount(filterId, maxValue ?? "");
  }, [isControlled, setMinAmount, setMaxAmount, filterId, minValue, maxValue]);

  const { minAmount, maxAmount, sortOrder } = store.getState(filterId);

  const handleMinMaxChange = (min: string, max: string) => {
    store.setMinAmount(filterId, min);
    store.setMaxAmount(filterId, max);
  };

  const handleSortChange = (sort: string) => {
    store.setSortOrder(filterId, sort);
  };

  const handleApply = () => {
    onApply(store.getState(filterId));
  };

  const handleReset = () => {
    store.reset(filterId, "");
    onReset();
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
        setFilter={handleMinMaxChange}
        initialMin={minAmount}
        initialMax={maxAmount}
      />
      {sortOptions && (
        <FilterSort
          title="Sort"
          options={sortOptions}
          setFilter={handleSortChange}
          initialValue={sortOrder}
        />
      )}
    </FilterBox>
  );
};
