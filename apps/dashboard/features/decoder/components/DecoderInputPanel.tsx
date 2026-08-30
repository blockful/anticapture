"use client";

import { useMemo } from "react";
import type { Abi } from "viem";

import { AbiInput } from "@/features/decoder/components/AbiInput";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import daoConfigByDaoId from "@/shared/dao-config";

interface DecoderInputPanelProps {
  calldata: string;
  address: string;
  chainId: number;
  calldataError: string | null;
  addressError: string | null;
  onCalldataChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onChainIdChange: (value: number) => void;
  onAbiChange: (abi: Abi | null) => void;
}

/** The chains the platform indexes, deduplicated from the DAO configs. */
const useChainOptions = () =>
  useMemo(() => {
    const byId = new Map<number, string>();
    for (const config of Object.values(daoConfigByDaoId)) {
      const chain = config?.daoOverview?.chain;
      if (chain && !byId.has(chain.id)) byId.set(chain.id, chain.name);
    }
    return [...byId.entries()]
      .sort(([a], [b]) => a - b)
      .map(([id, name]) => ({ label: name, value: String(id) }));
  }, []);

export const DecoderInputPanel = ({
  calldata,
  address,
  chainId,
  calldataError,
  addressError,
  onCalldataChange,
  onAddressChange,
  onChainIdChange,
  onAbiChange,
}: DecoderInputPanelProps) => {
  const chainOptions = useChainOptions();

  return (
    <div className="border-border-default bg-surface-default flex w-full flex-col gap-4 border p-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel isRequired>Calldata</FormLabel>
        <Textarea
          value={calldata}
          onChange={(event) => onCalldataChange(event.target.value)}
          placeholder="0x…"
          className="min-h-28 font-mono text-xs"
          error={Boolean(calldataError)}
        />
        {calldataError ? (
          <span className="text-error text-xs">{calldataError}</span>
        ) : (
          <span className="text-secondary text-xs">
            Paste calldata or a transaction&apos;s input data. On Etherscan:
            transaction page, &quot;More Details&quot;, then &quot;Input
            Data&quot;.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <FormLabel>Contract address (optional)</FormLabel>
          <Input
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="0x… enables verified-ABI lookup"
            error={Boolean(addressError)}
          />
          {addressError && (
            <span className="text-error text-xs">{addressError}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:w-48">
          <FormLabel>Chain</FormLabel>
          <Select
            items={chainOptions}
            value={String(chainId)}
            placeholder="Chain"
            onValueChange={(value) => onChainIdChange(Number(value))}
          />
        </div>
      </div>

      <AbiInput onAbiChange={onAbiChange} />
    </div>
  );
};
