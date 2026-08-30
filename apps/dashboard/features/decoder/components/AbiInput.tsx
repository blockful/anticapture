"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Abi } from "viem";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { parseAbiJson } from "@/shared/services/decoder";

interface AbiInputProps {
  onAbiChange: (abi: Abi | null) => void;
}

/**
 * Optional user-supplied ABI: paste JSON or pick a .json file (bare ABI array
 * or a Hardhat/Foundry artifact). Feeds the resolver's "uploaded" tier, which
 * outranks OpenChain guesses but never a verified ABI.
 */
export const AbiInput = ({ onAbiChange }: AbiInputProps) => {
  const [abiText, setAbiText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyText = (text: string) => {
    setAbiText(text);
    if (!text.trim()) {
      setError(null);
      onAbiChange(null);
      return;
    }
    const parsed = parseAbiJson(text);
    setError(parsed ? null : "Not a valid ABI JSON.");
    onAbiChange(parsed);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseAbiJson(text);
      if (!parsed) {
        setError("Not a valid ABI JSON file.");
        return;
      }
      setAbiText(JSON.stringify(parsed, null, 2));
      setError(null);
      onAbiChange(parsed);
    } catch {
      setError("Could not read the file.");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <FormLabel>ABI (optional)</FormLabel>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1"
        >
          <Upload className="size-3.5" />
          Upload JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFileUpload(file);
            event.target.value = "";
          }}
        />
      </div>
      <Textarea
        value={abiText}
        onChange={(event) => applyText(event.target.value)}
        placeholder='Paste ABI JSON — e.g. [{"type":"function",...}] or a compiler artifact'
        className="min-h-24 font-mono text-xs"
        error={Boolean(error)}
      />
      {error ? (
        <span className="text-error text-xs">{error}</span>
      ) : (
        <span className="text-secondary text-xs">
          Used before public signature lookups. A custom ABI isn&apos;t included
          in the shareable link.
        </span>
      )}
    </div>
  );
};
