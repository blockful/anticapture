"use client";

import { useState } from "react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";

interface ValueCellProps {
  /** Primary human reading ("10 years"). Absent = raw is the primary. */
  display?: string;
  /** Raw value, shown in the hover tooltip and via the inline swap. */
  raw: string;
  className?: string;
}

/**
 * Humanized-first value: clicking swaps human and raw inline (persists while
 * the card stays mounted); hovering reveals the raw value in a tooltip. The
 * dimmed right-column annotation lives in ParamRow, per Figma frame 08.
 */
export const ValueCell = ({ display, raw, className }: ValueCellProps) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!display || display === raw) {
    return (
      <span
        className={cn(
          "text-primary min-w-0 break-all font-mono text-sm leading-5",
          className,
        )}
      >
        {raw}
      </span>
    );
  }

  return (
    <Tooltip asChild tooltipContent={showRaw ? display : `raw: ${raw}`}>
      <button
        type="button"
        onClick={() => setShowRaw((current) => !current)}
        className={cn(
          "text-primary min-w-0 cursor-pointer break-all text-left font-mono text-sm leading-5",
          "decoration-border-contrast hover:underline hover:decoration-dotted hover:underline-offset-4",
          className,
        )}
        aria-label={showRaw ? "Show human-readable value" : "Show raw value"}
      >
        {showRaw ? raw : display}
      </button>
    </Tooltip>
  );
};
