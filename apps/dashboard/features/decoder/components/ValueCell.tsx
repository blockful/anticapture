"use client";

import { useState } from "react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { shortHex } from "@/features/decoder/utils/shortHex";
import { cn } from "@/shared/utils/cn";

interface ValueCellProps {
  /** Primary human reading ("10 years = 315,360,000 seconds"). */
  humanized?: string;
  /** Raw value; primary display when no humanized reading exists. */
  raw: string;
  className?: string;
}

/**
 * Humanized-first value: the human reading leads, the raw value sits dimmed
 * beside it. Clicking swaps the two inline and the swap persists while the
 * card stays mounted; hovering the human reading reveals the raw in a tooltip.
 */
export const ValueCell = ({ humanized, raw, className }: ValueCellProps) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!humanized) {
    return (
      <span
        className={cn(
          "text-secondary min-w-0 break-all font-mono text-sm leading-5",
          className,
        )}
      >
        {raw}
      </span>
    );
  }

  const primary = showRaw ? raw : humanized;
  const annotation = showRaw ? humanized : shortHex(raw, 12, 8);

  return (
    <span
      className={cn(
        "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5",
        className,
      )}
    >
      <Tooltip asChild tooltipContent={showRaw ? humanized : `raw: ${raw}`}>
        <button
          type="button"
          onClick={() => setShowRaw((current) => !current)}
          className={cn(
            "text-primary min-w-0 cursor-pointer break-all text-left text-sm leading-5",
            "decoration-border-contrast hover:underline hover:decoration-dotted hover:underline-offset-4",
            showRaw && "font-mono",
          )}
          aria-label={showRaw ? "Show human-readable value" : "Show raw value"}
        >
          {primary}
        </button>
      </Tooltip>
      <span className="text-dimmed min-w-0 break-all font-mono text-xs leading-4">
        {annotation}
      </span>
    </span>
  );
};
