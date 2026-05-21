"use client";

import Image from "next/image";
import { isAddress } from "viem";

import { Combobox } from "@/shared/components/design-system/combobox";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { useTokenList } from "@/features/create-proposal/hooks/useTokenList";
import type { DaoIdEnum } from "@/shared/types/daos";

interface TokenSelectorProps {
  value: string;
  onChange: (address: string) => void;
  daoId: DaoIdEnum;
}

export const TokenSelector = ({
  value,
  onChange,
  daoId,
}: TokenSelectorProps) => {
  const { tokens, isLoading, isError } = useTokenList(daoId);

  // P1: fall back to manual address input when the token list cannot load or is empty
  if (!isLoading && (isError || tokens.length === 0)) {
    return (
      <>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0x… token contract address"
          error={value !== "" && !isAddress(value)}
        />
        {isError && (
          <span className="text-error text-xs">
            Could not load tokens. Enter an address manually or try again.
          </span>
        )}
      </>
    );
  }

  const comboboxItems = tokens.map((token) => ({
    value: token.address,
    label: `${token.symbol} — ${token.name}`,
    icon: token.logoUri ? (
      <Image
        src={token.logoUri}
        alt=""
        aria-hidden
        width={16}
        height={16}
        className="shrink-0 rounded-full object-cover"
      />
    ) : undefined,
  }));

  // P2: when editing with a non-curated address, add a synthetic item so the
  // combobox shows the stored value rather than falling back to the placeholder
  const isCurated =
    value !== "" &&
    tokens.some((t) => t.address.toLowerCase() === value.toLowerCase());
  if (value && isAddress(value) && !isCurated) {
    comboboxItems.unshift({
      value: value.toLowerCase(),
      label: `${value.slice(0, 6)}…${value.slice(-4)}`,
      icon: undefined,
    });
  }

  return (
    <Combobox
      items={comboboxItems}
      value={value ? value.toLowerCase() : undefined}
      onValueChange={onChange}
      placeholder={isLoading ? "Loading tokens…" : "Select a token"}
      isDisabled={isLoading}
      className="w-full"
      contentClassName="max-h-36 overflow-y-auto"
    />
  );
};
