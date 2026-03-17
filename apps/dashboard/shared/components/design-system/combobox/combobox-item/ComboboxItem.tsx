// ⚠️ Internal component — use <Combobox> instead of rendering ComboboxItem directly.

import { CheckIcon } from "lucide-react";

import { itemStatusStyles } from "@/shared/components/design-system/combobox/styles";
import type { ComboboxItemProps } from "@/shared/components/design-system/combobox/types";
import { cn } from "@/shared/utils/cn";

/**
 * @internal
 * ComboboxItem is an internal building block of Combobox.
 * Do NOT use it in isolation — always use the full <Combobox> component instead,
 * which handles state, keyboard navigation, and accessibility.
 */
export const ComboboxItem = ({
  label,
  icon,
  status = "default",
  isSelected = false,
  disabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: ComboboxItemProps) => {
  const showCheck = isSelected || status === "active" || status === "filter";

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        // Base/layout
        "flex w-full items-center gap-1.5",
        // Sizing — px-3 (12px) py-2 (8px) from Figma blocks/padding-xlg and blocks/padding-md
        "px-3 py-2",
        // Typography
        "text-sm font-normal leading-5",
        // Colors/surfaces
        "text-primary",
        itemStatusStyles[status],
        // Transitions
        "transition-colors duration-150",
        // Interactive
        !disabled && "cursor-pointer",
        // Disabled state
        disabled && "pointer-events-none opacity-50",
        // Allow overrides
        className,
      )}
    >
      {/* Leading icon slot — 14px, only rendered when icon is provided */}
      {icon && (
        <span className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden">
          {icon}
        </span>
      )}

      {/* Label — fills remaining space */}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>

      {/* Trailing check icon — shown for active/filter/selected states, 14px */}
      {showCheck && (
        <CheckIcon
          className="text-primary size-3.5 shrink-0"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
