"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { ChangeEvent, useState } from "react";

import SearchField from "@/shared/components/design-system/SearchField";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/utils/";

interface AmountFilterProps {
  onApply: (params: { min?: number; max?: number }) => void;
  currentMin?: number;
  currentMax?: number;
  className?: string;
}

export function AmountFilter({
  onApply,
  currentMin,
  currentMax,
  className,
}: AmountFilterProps) {
  const [tempMin, setTempMin] = useState<string>(
    currentMin !== undefined ? String(currentMin) : "",
  );
  const [tempMax, setTempMax] = useState<string>(
    currentMax !== undefined ? String(currentMax) : "",
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleReset = () => {
    setTempMin("");
    setTempMax("");
    onApply({});
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempMin(currentMin !== undefined ? String(currentMin) : "");
      setTempMax(currentMax !== undefined ? String(currentMax) : "");
    }
  };

  const parseNum = (value: string): number | undefined => {
    if (value.trim() === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const handleApply = () => {
    onApply({ min: parseNum(tempMin), max: parseNum(tempMax) });
    setIsOpen(false);
  };

  const hasFilters = currentMin !== undefined || currentMax !== undefined;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ButtonFilter
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
          hasFilters={hasFilters}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        className={cn(
          "border-border-contrast bg-surface-contrast z-50 w-[300px] rounded-lg border p-0 shadow-lg",
        )}
      >
        <div className="flex flex-col gap-1 py-1">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-secondary font-mono text-xs font-medium uppercase">
              Custom Amount
            </span>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="text-secondary flex h-auto items-center justify-center p-1 hover:text-white"
            >
              <ResetIcon className="size-4" />
              <span className="ml-1 font-mono text-xs uppercase">Reset</span>
            </Button>
          </div>

          {/* Amount Range */}
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <SearchField
                placeholder="From"
                inputMode="numeric"
                value={tempMin}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTempMin(e.target.value.replace(/[^0-9.-]/g, ""))
                }
              />
              <SearchField
                placeholder="To"
                inputMode="numeric"
                value={tempMax}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTempMax(e.target.value.replace(/[^0-9.-]/g, ""))
                }
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="px-3 pb-3">
            <Button
              onClick={handleApply}
              className="bg-surface-action-primary hover:bg-surface-action-primary/80 text-inverted h-7 w-full px-2 py-1 text-sm font-medium leading-5"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
