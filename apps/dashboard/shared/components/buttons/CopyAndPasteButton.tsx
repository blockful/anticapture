"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils";
import { IconButton } from "@/shared/components";

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

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

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
    <IconButton
      onClick={handleCopy}
      disabled={disabled || !textToCopy}
      aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
      variant="ghost"
      className={cn("group", className)}
      size="lg"
      iconClassName={cn(
        isCopied ? "text-success" : "text-secondary group-hover:text-primary",
      )}
      icon={isCopied ? Check : Copy}
    />
  );
};
