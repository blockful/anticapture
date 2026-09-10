"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  disabled?: boolean;
  customTooltipText?: { default: string; copied: string };
  iconSize?: "sm" | "md" | "lg";
  /** How long the copied state shows before reverting. */
  feedbackDurationMs?: number;
}

export const CopyAndPasteButton = ({
  textToCopy,
  className,
  disabled = false,
  customTooltipText,
  iconSize = "lg",
  feedbackDurationMs = 2000,
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!textToCopy || disabled) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), feedbackDurationMs);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const tooltipText = customTooltipText
    ? isCopied
      ? customTooltipText.copied
      : customTooltipText.default
    : isCopied
      ? "Copied!"
      : "Copy to clipboard";

  return (
    <Tooltip asChild tooltipContent={tooltipText}>
      <IconButton
        onClick={handleCopy}
        disabled={disabled || !textToCopy}
        aria-label={tooltipText}
        variant="ghost"
        className={cn("group", className)}
        size={iconSize}
        iconClassName={cn(
          isCopied ? "text-success" : "text-secondary group-hover:text-primary",
        )}
        icon={isCopied ? Check : Copy}
      />
    </Tooltip>
  );
};
