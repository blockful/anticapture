"use client";

import { useMemo } from "react";
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

  const baseItems = useMemo(
    () =>
      tokens.map((token) => ({
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
      })),
    [tokens],
  );

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

  const normalizedValue = value ? value.toLowerCase() : undefined;
  const isInList =
    !!normalizedValue && tokens.some((t) => t.address === normalizedValue);
  const comboboxItems =
    normalizedValue && isAddress(value) && !isInList
      ? [
          {
            value: normalizedValue,
            label: `${value.slice(0, 6)}…${value.slice(-4)}`,
            icon: undefined,
          },
          ...baseItems,
        ]
      : baseItems;

  return (
    <Combobox
      items={comboboxItems}
      value={normalizedValue}
      onValueChange={onChange}
      placeholder={isLoading ? "Loading tokens…" : "Select a token"}
      isDisabled={isLoading}
      className="w-full"
      contentClassName="max-h-36 overflow-y-auto"
    />
  );
};
