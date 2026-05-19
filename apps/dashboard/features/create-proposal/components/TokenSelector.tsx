"use client";

import { Select } from "@/shared/components/design-system/form/fields/select/Select";
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
  const { tokens, isLoading } = useTokenList(daoId);

  const selectItems = tokens.map((token) => ({
    value: token.address,
    label: `${token.symbol} — ${token.name}`,
  }));

  const selectedAddress = tokens.find(
    (t) => t.address.toLowerCase() === value.toLowerCase(),
  )?.address;

  const handleSelectChange = (address: string) => {
    onChange(address);
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        items={selectItems}
        value={selectedAddress}
        onValueChange={handleSelectChange}
        placeholder={isLoading ? "Loading tokens…" : "Select a token"}
        disabled={isLoading}
      />
    </div>
  );
};
