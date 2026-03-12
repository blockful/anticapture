// ⚠️ Internal component — use <SegmentedControl> instead of rendering SegmentedControlItem directly.

import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { sizeStyles } from "@/shared/components/design-system/segmented-control/styles";
import type { SegmentedControlItemProps } from "@/shared/components/design-system/segmented-control/types";
import { cn } from "@/shared/utils/cn";

/**
 * @internal
 * SegmentedControlItem is an internal building block of SegmentedControl.
 * Do NOT use it in isolation — always use the full <SegmentedControl> component instead,
 * which manages selection state, keyboard navigation, and accessibility.
 */
export const SegmentedControlItem = ({
  label,
  isActive = false,
  size = "md",
  items,
  onClick,
  className,
}: SegmentedControlItemProps) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onClick}
      className={cn(
        // Base/layout
        "flex items-center justify-center gap-1.5",
        // Sizing — varies by size prop
        sizeStyles[size],
        // Typography
        "whitespace-nowrap font-medium",
        // Transitions
        "transition-colors duration-150",
        // Default (inactive) state
        "text-secondary",
        // Hover state — text becomes primary when not active
        !isActive && "hover:text-primary",
        // Active state — surface-contrast bg + shadow-xs
        isActive &&
          "bg-surface-contrast text-primary shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
        // Cursor
        "cursor-pointer",
        // Allow overrides
        className,
      )}
    >
      {label}
      {items !== undefined && (
        <BadgeStatus variant="dimmed">{items}</BadgeStatus>
      )}
    </button>
  );
};
