"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { cn } from "@/shared/utils/cn";

/**
 * Labelled copy action (ghost, small): "Copy raw", "Copy link". The label
 * itself swaps to "Copied" for 1.2s; no toast.
 */
export const CopyButton = ({
  textToCopy,
  getTextToCopy,
  label = "Copy raw",
  className,
}: {
  textToCopy?: string;
  /** Resolved at click time, for values that only exist in the browser
   *  (e.g. window.location.href for the permalink). */
  getTextToCopy?: () => string;
  label?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = getTextToCopy?.() ?? textToCopy;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      aria-label={label}
      className={cn("shrink-0", copied && "text-success", className)}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {copied ? "Copied" : label}
    </Button>
  );
};
