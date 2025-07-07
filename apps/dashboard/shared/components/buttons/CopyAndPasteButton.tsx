"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  disabled?: boolean;
}

export const CopyAndPasteButton = ({
  textToCopy,
  className,
  disabled = false,
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!textToCopy || disabled) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || !textToCopy}
      aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
      className={cn(
        "group flex size-8 cursor-pointer items-center justify-center rounded-md border border-[#3F3F46] bg-[#23243a] transition-all duration-200 active:scale-95",
        "hover:bg-[#2a2b42] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isCopied ? (
        <Check className="text-success size-4" />
      ) : (
        <Copy className="group-hover:text-primary text-primary size-4" />
      )}
    </button>
  );
};
