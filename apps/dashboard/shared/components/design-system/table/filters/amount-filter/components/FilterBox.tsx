"use client";

import { ReactNode, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import { ResetIcon } from "@radix-ui/react-icons";

interface FilterBoxProps<T> {
  className?: string;
  children: ReactNode;
  buttonTitle?: string;
  resetTitle?: string;
  headerTitle?: string;
  onApply: (values: T) => void;
  onReset?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const FilterBox = <T,>({
  className,
  children,
  buttonTitle = "Apply",
  resetTitle = "Reset",
  headerTitle,
  onApply,
  onReset,
  isActive = false,
  disabled = false,
}: FilterBoxProps<T>) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleApply = () => {
    onApply({} as unknown as T);
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset?.();
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
          {(headerTitle || onReset) && (
            <div className="flex items-center justify-between px-3 py-2">
              {headerTitle && (
                <h3 className="text-secondary text-alternative-xs font-medium uppercase">
                  {headerTitle}
                </h3>
              )}
              {onReset && (
                <button
                  onClick={handleReset}
                  className="text-secondary hover:text-primary text-alternative-xs flex cursor-pointer items-center gap-1 uppercase transition-colors"
                >
                  <ResetIcon className="size-4" />
                  {resetTitle}
                </button>
              )}
            </div>
          )}

          {children}

          {/* Apply button */}
          <div className="flex px-3 py-2">
            <button
              onClick={handleApply}
              disabled={disabled}
              className="text-inverted w-full cursor-pointer rounded-md bg-[#FAFAFA] px-2 py-1 text-sm font-normal transition-all hover:bg-[#FAFAFA]/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonTitle}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
