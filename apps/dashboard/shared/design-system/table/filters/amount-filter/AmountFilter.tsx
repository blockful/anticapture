"use client";

import { useEffect } from "react";
import {
  FilterBox,
  FilterMaxMinInput,
  FilterSort,
  SortOption,
} from "@/shared/design-system/table/filters/amount-filter/components";
import {
  useAmountFilterStore,
  AmountFilterState,
} from "@/shared/design-system/table/filters/amount-filter/store/amount-filter-store";

interface AmountFilterProps {
  className?: string;
  onApply: (state: AmountFilterState) => void;
  onReset: () => void;
  isActive?: boolean;
  sortOptions?: SortOption[];
  filterId: string;
}

export const AmountFilter = ({
  className,
  onApply,
  onReset,
  isActive = false,
  sortOptions,
  filterId,
}: AmountFilterProps) => {
  const store = useAmountFilterStore();

  const { minAmount, maxAmount, sortOrder } = store.getState(filterId);

  useEffect(() => {
    if (sortOptions && sortOptions[0]?.value && sortOrder === "") {
      store.initialize(filterId, sortOptions[0].value);
    }
  }, [sortOptions, sortOrder, filterId, store]);

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
    store.reset(filterId, sortOptions?.[0]?.value || "");
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
        <>
          <div className="border-border-contrast border-b" />
          <FilterSort
            title="Sort"
            options={sortOptions}
            setFilter={handleSortChange}
            initialValue={sortOrder}
          />
        </>
      )}
    </FilterBox>
  );
};
