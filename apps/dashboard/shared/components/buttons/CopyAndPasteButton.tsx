"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/shared/utils";
import { IconButton } from "@/shared/components";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  disabled?: boolean;
  customTooltipText?: { default: string; copied: string };
}

export const CopyAndPasteButton = ({
  textToCopy,
  className,
  disabled = false,
  customTooltipText,
}: CopyButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!textToCopy || disabled) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setOpen(true);
      setTimeout(() => setIsCopied(false), 2000);
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
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <IconButton
          onClick={handleCopy}
          disabled={disabled || !textToCopy}
          aria-label={tooltipText}
          variant="ghost"
          className={cn("group", className)}
          size="lg"
          iconClassName={cn(
            isCopied
              ? "text-success"
              : "text-secondary group-hover:text-primary",
          )}
          icon={isCopied ? Check : Copy}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        avoidCollisions={true}
        className={cn(
          "border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-3 text-center shadow-sm",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "wrap-break-word whitespace-normal",
        )}
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};
