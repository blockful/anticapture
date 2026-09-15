"use client";

import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/utils/cn";

/**
 * The one expand/collapse control every decoder card and row uses: a
 * chevron that points right when closed and down when open.
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
      "text-secondary hover:text-primary flex size-5 shrink-0 cursor-pointer items-center justify-center transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
      "focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none",
      className,
    )}
  >
    <ChevronRight
      aria-hidden="true"
      className={cn(
        "size-3.5 transition-transform duration-[120ms] ease-[var(--ease-decoder)]",
        expanded && "rotate-90",
      )}
    />
  </button>
);
