"use client";

import type { Address } from "viem";
import { isAddress } from "viem";

import { AddressChip } from "@/features/decoder/components/AddressChip";
import type { CollapsedLabel } from "@/features/decoder/utils/collapsedRowLabel";
import { cn } from "@/shared/utils/cn";

interface CollapsedActionRowProps {
  /** Zero-based action index; renders the #action-N anchor (one-based). */
  index: number;
  target: string | null;
  label: CollapsedLabel;
  onExpand: () => void;
  explorerUrl?: string;
  className?: string;
}

/**
 * One-line stand-in for a collapsed action:
 * `[+] [target chip] sentence-or-signature · signature`. The whole row is the
 * click target; only the chip's own controls stop propagation.
 */
export const CollapsedActionRow = ({
  index,
  target,
  label,
  onExpand,
  explorerUrl,
  className,
}: CollapsedActionRowProps) => (
  <div
    id={`action-${index + 1}`}
    role="button"
    tabIndex={0}
    onClick={onExpand}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onExpand();
      }
    }}
    aria-label={`Expand action ${index + 1}`}
    className={cn(
      "border-border-default bg-surface-default group flex w-full cursor-pointer items-center gap-2 border p-3",
      "hover:bg-surface-hover transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
      "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
      className,
    )}
  >
    <span className="text-secondary group-hover:text-highlight shrink-0 font-mono text-sm leading-5 transition-colors duration-[120ms] ease-[var(--ease-decoder)]">
      [+]
    </span>
    {target && isAddress(target) && (
      <span
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <AddressChip address={target as Address} explorerUrl={explorerUrl} />
      </span>
    )}
    <span className="text-secondary font-inter min-w-0 truncate text-sm leading-5">
      {label.label}
    </span>
    {label.signature && (
      <span className="text-dimmed hidden shrink-0 font-mono text-xs leading-4 sm:inline">
        · {label.signature}
      </span>
    )}
  </div>
);
