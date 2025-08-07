"use client";

import { ChangeEvent, useState } from "react";
import { Filter, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { getEnsAddress } from "viem/actions";
import { normalize } from "viem/ens";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/";
import SearchField from "@/shared/components/design-system/SearchField";
import { ResetIcon } from "@radix-ui/react-icons";
import { publicClient } from "@/shared/services/wallet/wallet";

interface AddressFilterProps {
  onApply: (address: string | undefined) => void;
  currentFilter?: string;
  className?: string;
}

const isEnsAddress = (address: string) => {
  try {
    normalize(address);
  } catch {
    return false;
  }

  return address.endsWith(".eth") && address.slice(0, -4).length >= 3;
};

export function AddressFilter({
  onApply,
  currentFilter = "",
  className,
}: AddressFilterProps) {
  const [tempAddress, setTempAddress] = useState<string>(currentFilter);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [ensAddressError, setEnsAddressError] = useState<string | null>(null);

  const isValidAddress =
    tempAddress.trim() &&
    (isAddress(tempAddress.trim()) || isEnsAddress(tempAddress.trim()));

  const handleApply = async () => {
    const trimmedAddress = tempAddress.trim();

    if (!trimmedAddress) {
      onApply(undefined);
      return;
    }

    // If it's already a valid Ethereum address, use it directly
    if (isAddress(trimmedAddress)) {
      onApply(trimmedAddress);
      return;
    }

    // If it's an ENS name, resolve it
    if (isEnsAddress(trimmedAddress)) {
      setIsResolving(true);
      try {
        const resolvedAddress = await getEnsAddress(publicClient, {
          name: normalize(trimmedAddress),
        });

        if (resolvedAddress) {
          onApply(resolvedAddress);
        } else {
          // ENS name doesn't resolve to an address
          onApply(undefined);
          setEnsAddressError("ENS name could not be resolved");
        }
      } catch (error) {
        console.error("Error resolving ENS address:", error);
        onApply(undefined);
      } finally {
        setIsResolving(false);
      }
    } else {
      onApply(undefined);
    }
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
            "group flex cursor-pointer items-center rounded-sm border p-1 transition-colors",
            "hover:border-highlight bg-surface-hover border-transparent",
            currentFilter && "border-highlight bg-surface-hover",
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
          "border-border-contrast bg-surface-contrast z-50 w-[260px] rounded-lg border p-0 shadow-lg",
        )}
      >
        <div className="flex flex-col gap-1 py-1">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-secondary font-mono text-xs font-medium uppercase">
              Search Address
            </span>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="text-secondary flex h-auto items-center justify-center p-1 hover:text-white"
            >
              <ResetIcon className="size-4" />
              <span className="ml-1 font-mono text-xs uppercase">RESET</span>
            </Button>
          </div>

          {/* Input Section */}
          <div className="px-3">
            <SearchField
              placeholder="Search by address"
              value={tempAddress}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setTempAddress(e.target.value);
                setEnsAddressError(null);
              }}
            />
            {tempAddress.trim() && !isValidAddress && (
              <p className="text-error mt-2 text-xs">
                Please enter a valid Ethereum address or ENS name
              </p>
            )}
            {ensAddressError && (
              <p className="text-error mt-2 text-xs">{ensAddressError}</p>
            )}
          </div>

          {/* Apply Button */}
          <div className="px-3 py-2">
            <Button
              onClick={handleApply}
              disabled={
                (tempAddress.trim() !== "" && !isValidAddress) || isResolving
              }
              className="h-[28px] w-full bg-white px-2 py-1 text-sm leading-[20px] text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving ENS...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
