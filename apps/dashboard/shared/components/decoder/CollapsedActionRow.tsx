"use client";

import type { Address } from "viem";
import { isAddress } from "viem";

import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { ExpandToggle } from "@/shared/components/decoder/ExpandToggle";
import type { CollapsedLabel } from "@/shared/utils/collapsedRowLabel";
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
 * header bar and a one-line body — `[target chip] sentence` with the
 * signature right-aligned and dimmed. The expand control sits at the header's
 * right edge, exactly where the collapse control sits on an expanded card, so
 * the eye never has to hunt for it; the body is a second, larger click target.
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
    <div className="bg-surface-contrast flex w-full items-center gap-2 px-3 py-2">
      <p className="text-primary shrink-0 font-mono text-xs font-medium uppercase leading-4 tracking-wider">
        {"//"}action {String(index + 1).padStart(2, "0")}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {target && explorerUrl && (
          <DefaultLink
            href={`${explorerUrl}/address/${target}`}
            openInNewTab
            className="text-secondary hidden font-mono text-xs font-medium uppercase leading-4 tracking-wider md:inline-flex"
          >
            Contract
          </DefaultLink>
        )}
        <ExpandToggle
          expanded={false}
          onToggle={onExpand}
          label={`Expand action ${index + 1}`}
        />
      </div>
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
        "group flex w-full min-w-0 cursor-pointer items-center gap-2 p-3",
        "hover:bg-surface-hover transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
      )}
    >
      {target && isAddress(target) && (
        <span
          className="flex min-w-0 max-w-[45%] shrink-0"
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
      {/* The sentence is the content: it takes what the chip leaves and may
          run to a second line on phones instead of being cut mid-word. */}
      <span className="text-primary font-inter line-clamp-2 min-w-0 flex-1 text-sm leading-5 md:line-clamp-1">
        {label.label}
      </span>
      {label.signature && (
        // min-w-0 + truncate (never shrink-0): a long signature must ellipsize
        // inside the row, not overflow the card. The higher shrink weight makes
        // the signature give way before the sentence does.
        <span className="text-dimmed hidden min-w-0 shrink-[4] truncate text-right font-mono text-xs leading-5 md:block">
          {label.signature}
        </span>
      )}
    </div>
  </div>
);
