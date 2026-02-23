"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { isAddress } from "viem";
import { normalize } from "viem/ens";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import SearchField from "@/shared/components/design-system/SearchField";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { fetchAddressFromEnsName } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/";

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
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isValidAddress =
    tempAddress.trim() &&
    (isAddress(tempAddress.trim()) || isEnsAddress(tempAddress.trim()));

  const handleApply = async () => {
    const trimmedAddress = tempAddress.trim();

    if (!trimmedAddress) {
      onApply(undefined);
      setIsOpen(false);
      return;
    }

    // If it's already a valid Ethereum address, use it directly
    if (isAddress(trimmedAddress)) {
      onApply(trimmedAddress);
      setIsOpen(false);
      return;
    }

    // If it's an ENS name, resolve it
    if (isEnsAddress(trimmedAddress)) {
      setIsResolving(true);
      try {
        const resolvedAddress = await fetchAddressFromEnsName({
          ensName: trimmedAddress as `${string}.eth`,
        });

        if (resolvedAddress) {
          onApply(resolvedAddress);
          setIsOpen(false);
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
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempAddress(currentFilter);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ButtonFilter
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
          hasFilters={!!currentFilter}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        className={cn(
          "border-border-contrast bg-surface-contrast z-50 w-[262px] border p-0 shadow-lg",
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
              <span className="ml-1 font-mono text-xs uppercase">Reset</span>
            </Button>
          </div>

          {/* Input Section */}
          <div className="px-3">
            <SearchField
              placeholder="Paste the address"
              value={tempAddress}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setTempAddress(e.target.value);
                setEnsAddressError(null);
              }}
              className="text-dimmed placeholder:text-dimmed w-full bg-transparent text-sm font-normal leading-5 outline-none"
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
              size="sm"
              variant="primary"
              className="w-full"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
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
