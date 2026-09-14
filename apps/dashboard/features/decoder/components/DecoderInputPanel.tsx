"use client";

import { useMemo } from "react";
import type { Abi } from "viem";

import { AbiInput } from "@/features/decoder/components/AbiInput";
import { supportedDecoderChains } from "@/features/decoder/utils/chains";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";

interface DecoderInputPanelProps {
  calldata: string;
  address: string;
  chainId: number;
  calldataError: string | null;
  /** Said out loud, not silently: the field no longer holds what was pasted. */
  calldataNotice?: string | null;
  addressError: string | null;
  onCalldataChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onChainIdChange: (value: number) => void;
  onAbiChange: (abi: Abi | null) => void;
}

/** The chains the platform indexes, deduplicated from the DAO configs. */
const useChainOptions = () =>
  useMemo(
    () =>
      supportedDecoderChains().map(({ id, name }) => ({
        label: name,
        value: String(id),
      })),
    [],
  );

export const DecoderInputPanel = ({
  calldata,
  address,
  chainId,
  calldataError,
  calldataNotice,
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FormLabel isRequired>Calldata</FormLabel>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-wider"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) onCalldataChange(text);
                } catch {
                  // Clipboard read denied: the reader pastes into the field.
                }
              }}
            >
              [paste]
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-wider"
              disabled={calldata.length === 0}
              onClick={() => onCalldataChange("")}
            >
              [clear]
            </Button>
          </div>
        </div>
        <Textarea
          value={calldata}
          onChange={(event) => onCalldataChange(event.target.value)}
          placeholder="0x…"
          className="min-h-28 font-mono text-xs"
          error={Boolean(calldataError)}
        />
        {calldataError ? (
          <span className="text-error text-xs">{calldataError}</span>
        ) : calldataNotice ? (
          <span className="text-warning text-xs">{calldataNotice}</span>
        ) : (
          <span className="text-secondary text-xs">
            Supports raw calldata (0x-prefixed hex). On Etherscan: transaction
            page, &quot;More Details&quot;, then copy the &quot;Input
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
