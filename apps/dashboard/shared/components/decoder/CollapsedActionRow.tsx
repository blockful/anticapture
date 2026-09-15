"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import { isAddress } from "viem";

import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { MONO_LABEL } from "@/shared/components/decoder/styles";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { cn } from "@/shared/utils/cn";
import type { CollapsedLabel } from "@/shared/utils/collapsedRowLabel";

interface CollapsedActionRowProps {
  /** Zero-based action index; renders the #action-N anchor (one-based). */
  index: number;
  target: string | null;
  chainId: number;
  label: CollapsedLabel;
  onExpand: () => void;
  explorerUrl?: string;
  className?: string;
}

/**
 * Collapsed action, per Figma frame 09: a card with the same `//ACTION NN`
 * header bar and a one-line body of `› [target chip] sentence` with the
 * signature right-aligned and secondary. The whole body is the click
 * target; the chevron says which way it opens.
 */
export const CollapsedActionRow = ({
  index,
  target,
  chainId,
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
    <div className="bg-surface-contrast border-border-default flex w-full items-center gap-2 border-b px-3 py-2">
      <p className={cn("text-primary shrink-0", MONO_LABEL)}>
        {"//"}action {String(index + 1).padStart(2, "0")}
      </p>
      {target && explorerUrl && (
        <DefaultLink
          href={`${explorerUrl}/address/${target}`}
          openInNewTab
          size="sm"
          className="ml-auto shrink-0"
        >
          Contract
          <ExternalLink className="size-3" aria-hidden="true" />
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
        "group flex w-full min-w-0 cursor-pointer items-center gap-2 p-3",
        "hover:bg-surface-hover transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
      )}
    >
      <ChevronRight
        aria-hidden="true"
        className="text-secondary group-hover:text-primary size-3.5 shrink-0"
      />
      {target !== null && isAddress(target) && (
        <span
          className="flex min-w-0 max-w-[45%] shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <AddressChip
            address={target}
            chainId={chainId}
            explorerUrl={explorerUrl}
            compact
          />
        </span>
      )}
      {/* The sentence is the content: it takes what the chip leaves and may
          run to a second line on phones instead of being cut mid-word. */}
      <span className="text-primary line-clamp-2 min-w-0 flex-1 text-sm leading-5 md:line-clamp-1">
        {label.label}
      </span>
      {label.signature && (
        // min-w-0 + truncate (never shrink-0): a long signature must ellipsize
        // inside the row, not overflow the card. The higher shrink weight makes
        // the signature give way before the sentence does.
        <span className="text-secondary hidden min-w-0 shrink-[4] truncate text-right text-sm leading-5 md:block">
          {label.signature}
        </span>
      )}
    </div>
  </div>
);
