"use client";

import { ChangeEvent, useState } from "react";
import { Filter } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/";
import SearchField from "@/shared/components/design-system/SearchField";
import { ResetIcon } from "@radix-ui/react-icons";

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

  const handleReset = () => {
    setTempMin("");
    setTempMax("");
    onApply({});
  };

  const handleOpenChange = (open: boolean) => {
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
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label="Filter amount"
          className={cn(
            "group flex cursor-pointer items-center rounded-sm border p-1 transition-colors",
            "hover:border-highlight bg-surface-hover border-transparent",
            (currentMin !== undefined || currentMax !== undefined) &&
              "border-highlight bg-surface-hover",
            className,
          )}
        >
          <Filter className="text-primary size-3" />
        </button>
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
              className="hover:bg-surface-hover h-[28px] w-full bg-white px-2 py-1 text-sm leading-[20px] text-black"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
