"use client";

import { Clipboard, Eraser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Abi } from "viem";

import { AbiInput } from "@/features/decoder/components/AbiInput";
import { supportedDecoderChains } from "@/features/decoder/utils/chains";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import { cn } from "@/shared/utils/cn";

/** Where the decoder looks for an ABI beyond the public signature databases. */
export type AbiSourceMode = "automatic" | "contract" | "custom";

const ABI_SOURCE_TABS: Array<{ label: string; value: AbiSourceMode }> = [
  { label: "Automatic", value: "automatic" },
  { label: "Contract address", value: "contract" },
  { label: "Custom ABI", value: "custom" },
];

const isAbiSourceMode = (value: string): value is AbiSourceMode =>
  ABI_SOURCE_TABS.some((tab) => tab.value === value);

interface DecoderInputPanelProps {
  calldata: string;
  address: string;
  chainId: number;
  mode: AbiSourceMode;
  calldataError: string | null;
  /** Said out loud, not silently: the field no longer holds what was pasted. */
  calldataNotice?: string | null;
  addressError: string | null;
  onCalldataChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onChainIdChange: (value: number) => void;
  onAbiChange: (abi: Abi | null) => void;
  onModeChange: (mode: AbiSourceMode) => void;
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

const HelperText = ({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "error" | "warning";
}) => (
  <span
    className={cn(
      "text-xs leading-4",
      tone === "error" && "text-error",
      tone === "warning" && "text-warning",
      tone === "default" && "text-secondary",
    )}
  >
    {children}
  </span>
);

/**
 * The input card: calldata pinned at the top, the ABI source behind three
 * tabs (Automatic / Contract address / Custom ABI) and the chain picker in
 * the header. The extra inputs stay mounted while hidden so a pasted ABI
 * survives a look at the other tabs.
 */
export const DecoderInputPanel = ({
  calldata,
  address,
  chainId,
  mode,
  calldataError,
  calldataNotice,
  addressError,
  onCalldataChange,
  onAddressChange,
  onChainIdChange,
  onAbiChange,
  onModeChange,
}: DecoderInputPanelProps) => {
  const chainOptions = useChainOptions();

  // `readText` is missing in Firefox and throws outside secure contexts, so
  // the button only exists where it can work, and a denied read says so
  // instead of silently doing nothing. Checked in an effect: the server has
  // no navigator, and the first client frame must match it.
  const [canPaste, setCanPaste] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  useEffect(() => {
    setCanPaste(typeof navigator.clipboard?.readText === "function");
  }, []);

  const handleCalldataChange = (value: string) => {
    setPasteError(null);
    onCalldataChange(value);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleCalldataChange(text);
      } else {
        setPasteError("Nothing to paste: the clipboard is empty.");
      }
    } catch {
      setPasteError(
        "Clipboard access was denied. Paste into the field with Ctrl+V or Cmd+V.",
      );
    }
  };

  const chainPicker = (
    <div className="flex items-center justify-between gap-2 md:justify-start">
      <FormLabel>Chain</FormLabel>
      <Select
        items={chainOptions}
        value={String(chainId)}
        placeholder="Chain"
        aria-label="Chain"
        onValueChange={(value) => onChainIdChange(Number(value))}
        className="h-7 w-36 py-1"
      />
    </div>
  );

  const calldataHelper = calldataError ? (
    <HelperText tone="error">{calldataError}</HelperText>
  ) : pasteError ? (
    <HelperText tone="error">{pasteError}</HelperText>
  ) : calldataNotice ? (
    <HelperText tone="warning">{calldataNotice}</HelperText>
  ) : (
    <HelperText>
      Raw, 0x-prefixed hex. Any EVM transaction, any length.
    </HelperText>
  );

  return (
    <div className="bg-surface-default flex w-full flex-col">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 px-3">
        {/* Three tabs do not fit a phone at this size; the strip scrolls
            sideways instead of pushing the page wider. */}
        <div className="min-w-0 overflow-x-auto [scrollbar-width:none]">
          <TabGroup
            size="md"
            tabs={ABI_SOURCE_TABS}
            activeTab={mode}
            onTabChange={(value) => {
              if (isAbiSourceMode(value)) onModeChange(value);
            }}
            className="border-b-0"
          />
        </div>
        <div className="hidden shrink-0 py-2 md:block">{chainPicker}</div>
      </div>

      <div className="flex w-full flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <FormLabel isRequired>Calldata</FormLabel>
            <div className="flex items-center gap-1">
              {canPaste && (
                <Button variant="ghost" size="sm" onClick={paste}>
                  <Clipboard className="size-3.5" aria-hidden="true" />
                  Paste
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={calldata.length === 0}
                onClick={() => handleCalldataChange("")}
              >
                <Eraser className="size-3.5" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            value={calldata}
            onChange={(event) => handleCalldataChange(event.target.value)}
            placeholder="0x…"
            aria-label="Calldata"
            className="min-h-20 break-all"
            error={Boolean(calldataError)}
          />
          {calldataHelper}
        </div>

        <div
          className={cn("flex flex-col gap-2", mode !== "contract" && "hidden")}
        >
          <FormLabel isOptional>Contract address</FormLabel>
          <Input
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="0x… the contract this transaction calls"
            aria-label="Contract address"
            error={Boolean(addressError)}
          />
          {addressError ? (
            <HelperText tone="error">{addressError}</HelperText>
          ) : (
            <HelperText>
              We look up the verified ABI for this contract. Your calldata stays
              as it is.
            </HelperText>
          )}
        </div>

        <div className={cn(mode !== "custom" && "hidden")}>
          <AbiInput onAbiChange={onAbiChange} />
        </div>

        <div className="md:hidden">{chainPicker}</div>
      </div>
    </div>
  );
};
