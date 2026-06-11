import { BadgeStatus } from "@/shared/components/design-system/badges";
import { sizeStyles } from "@/shared/components/design-system/tabs/styles";
import type { TabProps } from "@/shared/components/design-system/tabs/types";
import { cn } from "@/shared/utils/cn";

export const Tab = ({
  label,
  isActive = false,
  size = "sm",
  variant = "underline",
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
        // Underline active state — text-highlight + bottom border
        variant === "underline" &&
          isActive &&
          "border-highlight text-highlight border-b",
        // Button variant — bordered pill; active state picks up the DAO brand
        // color through the highlight/brand tokens on whitelabel themes
        variant === "button" && "rounded-base border px-3 py-2",
        variant === "button" &&
          (isActive
            ? "border-highlight text-link bg-surface-opacity-brand hover:text-link"
            : "border-border-contrast hover:bg-surface-contrast"),
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
