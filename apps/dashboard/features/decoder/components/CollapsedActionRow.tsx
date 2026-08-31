"use client";

import type { Address } from "viem";
import { isAddress } from "viem";

import { AddressChip } from "@/features/decoder/components/AddressChip";
import type { CollapsedLabel } from "@/features/decoder/utils/collapsedRowLabel";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
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
 * Collapsed action, per Figma frame 08: a card with the same `//ACTION NN`
 * header bar (plus CONTRACT link) and a one-line body —
 * `[+] [target chip] sentence` with the signature right-aligned and dimmed.
 * The body is the click target; the chip's own controls stop propagation.
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
    className={cn(
      "border-border-default bg-surface-default flex w-full flex-col border",
      className,
    )}
  >
    <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 px-3 py-2">
      <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider">
        {"//"}action {String(index + 1).padStart(2, "0")}
      </p>
      {target && explorerUrl && (
        <DefaultLink
          href={`${explorerUrl}/address/${target}`}
          openInNewTab
          className="text-secondary font-mono text-xs font-medium uppercase leading-4 tracking-wider"
        >
          Contract
        </DefaultLink>
      )}
    </div>
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onExpand();
        }
      }}
      aria-label={`Expand action ${index + 1}`}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 p-3",
        "hover:bg-surface-hover transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
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
          <AddressChip
            address={target as Address}
            explorerUrl={explorerUrl}
            compact
          />
        </span>
      )}
      <span className="text-primary font-inter min-w-0 truncate text-sm leading-5">
        {label.label}
      </span>
      {label.signature && (
        // min-w-0 + truncate (never shrink-0): a long signature must ellipsize
        // inside the row, not overflow the card. The higher shrink weight makes
        // the signature give way before the sentence does.
        <span className="text-dimmed ml-auto hidden min-w-0 shrink-[4] truncate text-right font-mono text-xs leading-5 sm:block">
          {label.signature}
        </span>
      )}
    </div>
  </div>
);
