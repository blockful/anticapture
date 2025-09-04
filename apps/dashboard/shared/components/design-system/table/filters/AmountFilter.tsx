"use client";

import { useState } from "react";
import { cn } from "@/shared/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import { ArrowRightIcon, ResetIcon } from "@radix-ui/react-icons";
import { GetDelegateDelegationHistoryDeltaRangeQueryVariables } from "@anticapture/graphql-client";
import { RadioButton } from "@/shared/components/design-system/buttons/RadioButton";

export type SortOrder = "largest-first" | "smallest-first";

export interface AmountFilterState {
  minAmount: string;
  maxAmount: string;
  sortOrder: SortOrder;
}

export interface AmountFilterVariables
  extends Pick<
    GetDelegateDelegationHistoryDeltaRangeQueryVariables,
    "delta_gte" | "delta_lte"
  > {
  orderDirection?: "asc" | "desc";
}
interface AmountFilterProps {
  className?: string;
  onApply: (state: AmountFilterState, variables: AmountFilterVariables) => void;
  onReset: () => void;
  initialState?: Partial<AmountFilterState>;
  isActive?: boolean;
}

export const AmountFilter = ({
  className,
  onApply,
  onReset,
  initialState = {},
  isActive = false,
}: AmountFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minAmount, setMinAmount] = useState(initialState.minAmount || "");
  const [maxAmount, setMaxAmount] = useState(initialState.maxAmount || "");
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    initialState.sortOrder || "largest-first",
  );

  const handleApply = () => {
    const filterState: AmountFilterState = {
      minAmount,
      maxAmount,
      sortOrder,
    };

    const variables: AmountFilterVariables = {
      orderDirection: sortOrder === "largest-first" ? "desc" : "asc",
    };

    // Add range filters if values are provided
    if (minAmount) {
      // Convert to BigInt wei format (multiply by 10^18)
      variables.delta_gte = (
        parseFloat(minAmount) * Math.pow(10, 18)
      ).toString();
    }
    if (maxAmount) {
      // Convert to BigInt wei format (multiply by 10^18)
      variables.delta_lte = (
        parseFloat(maxAmount) * Math.pow(10, 18)
      ).toString();
    }

    onApply(filterState, variables);
    setIsOpen(false);
  };

  const handleReset = () => {
    setMinAmount("");
    setMaxAmount("");
    setSortOrder("largest-first");
    onReset();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ButtonFilter
          onClick={() => setIsOpen(!isOpen)}
          isActive={isActive || isOpen}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        className="border-border-contrast w-72 p-0"
        align="start"
        sideOffset={4}
      >
        <div className="bg-surface-contrast flex flex-col gap-1 rounded-lg py-1">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-secondary text-alternative-xs font-medium uppercase">
              Custom Amount
            </h3>
            <button
              onClick={handleReset}
              className="text-secondary hover:text-primary text-alternative-xs flex cursor-pointer items-center gap-1 uppercase transition-colors"
            >
              <ResetIcon className="size-4" />
              Reset
            </button>
          </div>

          {/* Amount inputs */}
          <div className="border-border-contrast flex items-center gap-1 border-b px-3 pb-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none"
              />
            </div>
            <div className="text-dimmed">
              <ArrowRightIcon className="size-3.5" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="bg-surface-default border-border-default text-dimmed placeholder:text-dimmed focus:border-border-contrast h-10 w-full rounded border px-2.5 py-2 text-sm transition-colors focus:outline-none"
              />
            </div>
          </div>

          {/* Sort section */}
          <div className="flex px-3 py-2">
            <h4 className="text-secondary text-alternative-xs font-medium uppercase">
              Sort
            </h4>
          </div>

          {/* Sort buttons */}
          <div className="flex w-full gap-1 px-3">
            <button
              onClick={() => setSortOrder("largest-first")}
              className={cn(
                "bg-surface-default text-primary border-border-contrast flex items-center justify-between text-nowrap rounded-md border px-2.5 py-2 text-sm font-normal transition-all",
                sortOrder === "largest-first" && "bg-surface-hover",
              )}
            >
              Largest first
              <RadioButton
                label=""
                className="flex"
                checked={sortOrder === "largest-first"}
              />
            </button>
            <button
              onClick={() => setSortOrder("smallest-first")}
              className={cn(
                "bg-surface-default text-primary border-border-contrast flex items-center justify-between text-nowrap rounded-md border px-2.5 py-2 text-sm font-normal transition-all",
                sortOrder === "smallest-first" && "bg-surface-hover",
              )}
            >
              Smallest first
              <RadioButton
                label=""
                className="flex"
                checked={sortOrder === "smallest-first"}
              />
            </button>
          </div>

          {/* Apply button */}
          <div className="flex px-3 py-2">
            <button
              onClick={handleApply}
              className="text-inverted w-full cursor-pointer rounded-md bg-[#FAFAFA] px-2 py-1 text-sm font-normal transition-all hover:bg-[#FAFAFA]/80"
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
