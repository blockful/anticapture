"use client";

import { cn } from "@/shared/utils/cn";

/**
 * The one expand/collapse control every decoder card uses, always at the
 * header's right edge: `[+]` closed, `[−]` open. Same glyph family as the
 * copy controls so the header reads as one line of mono affordances.
 */
export const ExpandToggle = ({
  expanded,
  onToggle,
  label,
  className,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
    }}
    aria-label={label}
    aria-expanded={expanded}
    className={cn(
      "text-secondary hover:text-primary shrink-0 cursor-pointer font-mono text-xs font-medium uppercase leading-4 tracking-wider transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
      "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
      className,
    )}
  >
    {expanded ? "[–]" : "[+]"}
  </button>
);
