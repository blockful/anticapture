"use client";

import { useState } from "react";

import { cn } from "@/shared/utils/cn";

interface ValueCellProps {
  /** Primary human reading ("10 years"). Absent = raw is the primary. */
  display?: string;
  /** Raw value, swapped in inline on click. */
  raw: string;
  className?: string;
}

const isHexLike = (value: string): boolean => /^0x[0-9a-fA-F]*$/.test(value);

/** A word-guessed leaf can hold the whole tail of a 128 KiB payload, and a
 *  native tooltip is no place for it. */
const TITLE_MAX_CHARS = 256;

const asTitle = (value: string): string =>
  value.length > TITLE_MAX_CHARS
    ? `${value.slice(0, TITLE_MAX_CHARS)}…`
    : value;

/**
 * Humanized-first value. Numbers and symbols never break mid-token: they stay
 * on one line with tabular digits and ellipsize when the column is too
 * narrow (the full text is in the title and one click away). Only hex blobs
 * wrap character-wise, since they have no word boundaries to respect.
 * Clicking swaps human and raw inline for as long as the card stays mounted;
 * the dimmed annotation in ParamRow carries the raw value at rest.
 */
export const ValueCell = ({ display, raw, className }: ValueCellProps) => {
  const [showRaw, setShowRaw] = useState(false);

  const shown = showRaw || !display || display === raw ? raw : display;
  const textClass = isHexLike(shown)
    ? "break-all"
    : "truncate tabular-nums whitespace-nowrap";

  if (!display || display === raw) {
    return (
      <span
        title={asTitle(raw)}
        className={cn(
          "text-primary block min-w-0 font-mono text-sm leading-5",
          textClass,
          className,
        )}
      >
        {raw}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={showRaw ? asTitle(display) : `raw: ${asTitle(raw)}`}
      onClick={() => setShowRaw((current) => !current)}
      className={cn(
        "text-primary block min-w-0 max-w-full cursor-pointer text-left font-mono text-sm leading-5",
        "decoration-border-contrast hover:underline hover:decoration-dotted hover:underline-offset-4",
        textClass,
        className,
      )}
      aria-label={showRaw ? "Show human-readable value" : "Show raw value"}
    >
      {shown}
    </button>
  );
};
