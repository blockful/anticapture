"use client";

import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { isAddress } from "viem";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/";
import SearchField from "../SearchField";

interface AddressFilterProps {
  onApply: (address: string | undefined) => void;
  currentFilter?: string;
  className?: string;
}

export function AddressFilter({
  onApply,
  currentFilter = "",
  className,
}: AddressFilterProps) {
  const [tempAddress, setTempAddress] = useState<string>(currentFilter);

  const isValidAddress = tempAddress.trim() && isAddress(tempAddress.trim());

  const handleApply = () => {
    const trimmedAddress = tempAddress.trim();
    onApply(
      trimmedAddress && isAddress(trimmedAddress) ? trimmedAddress : undefined,
    );
  };

  const handleReset = () => {
    setTempAddress("");
    onApply(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempAddress(currentFilter);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label="Filter by address"
          className={cn(
            "hover:bg-surface-contrast flex items-center justify-center rounded border border-gray-600 p-1 transition-colors",
            currentFilter && "border-blue-500 bg-blue-500/10",
            className,
          )}
        >
          <Filter className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        className={cn(
          "border-light-dark bg-surface-contrast z-50 w-80 rounded-lg border p-0 shadow-lg",
        )}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-600 px-4 py-3">
            <span className="text-sm font-medium text-gray-300">
              SEARCH ADDRESS
            </span>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-gray-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-1 text-xs">RESET</span>
            </Button>
          </div>

          {/* Input Section */}
          <div className="p-4">
            <SearchField
              placeholder="Search by address"
              value={tempAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTempAddress(e.target.value)
              }
            />
            {tempAddress.trim() && !isValidAddress && (
              <p className="mt-2 text-xs text-red-400">
                Please enter a valid Ethereum address
              </p>
            )}
          </div>

          {/* Apply Button */}
          <div className="border-t border-gray-600 p-4">
            <Button
              onClick={handleApply}
              disabled={tempAddress.trim() !== "" && !isValidAddress}
              className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
