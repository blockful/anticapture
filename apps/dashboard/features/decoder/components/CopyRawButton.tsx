"use client";

import { useState } from "react";

import { cn } from "@/shared/utils/cn";

/**
 * Labeled copy affordance for a card's raw calldata. Per the interaction spec
 * the label itself swaps to "copied ✓" for 1.2s; no toast.
 */
export const CopyRawButton = ({
  textToCopy,
  label = "copy raw calldata",
  className,
}: {
  textToCopy: string;
  label?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "cursor-pointer font-mono text-xs uppercase leading-4 tracking-wider transition-colors duration-[120ms]",
        copied ? "text-success" : "text-secondary hover:text-primary",
        "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
        className,
      )}
    >
      {copied ? "copied ✓" : `[${label}]`}
    </button>
  );
};
