import { BadgeStatus } from "@/shared/components/design-system/badges";
import { sizeStyles } from "@/shared/components/design-system/tabs/styles";
import type { TabProps } from "@/shared/components/design-system/tabs/types";
import { cn } from "@/shared/utils/cn";

export const Tab = ({
  label,
  isActive = false,
  size = "sm",
  badge,
  onClick,
  className,
}: TabProps) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        // Base/layout
        "flex items-center justify-center",
        // Sizing — varies by size prop
        sizeStyles[size],
        // Typography
        "whitespace-nowrap font-normal",
        // Colors/surfaces
        "bg-transparent",
        // Transitions
        "transition-colors duration-150",
        // Default state
        "text-secondary hover:text-primary",
        // Active state — text-highlight + bottom border
        isActive && "border-highlight text-highlight border-b",
        // Cursor
        "cursor-pointer",
        // Allow overrides
        className,
      )}
    >
      {label}
      {badge !== undefined && (
        <BadgeStatus variant="secondary">{badge}</BadgeStatus>
      )}
    </button>
  );
};
