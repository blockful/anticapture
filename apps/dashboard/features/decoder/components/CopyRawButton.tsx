"use client";

import { useState } from "react";

import { cn } from "@/shared/utils/cn";

/**
 * Labeled copy affordance for a card's raw calldata. Per the interaction spec
 * the label itself swaps to "copied ✓" for 1.2s; no toast.
 */
export const CopyRawButton = ({
  textToCopy,
  getTextToCopy,
  label = "copy raw calldata",
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

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "cursor-pointer font-mono text-xs uppercase leading-4 tracking-wider transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        copied ? "text-success" : "text-secondary hover:text-primary",
        "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
        className,
      )}
    >
      {copied ? "copied ✓" : `[${label}]`}
    </button>
  );
};
