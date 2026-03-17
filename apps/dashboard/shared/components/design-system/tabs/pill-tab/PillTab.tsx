import type { PillTabProps } from "@/shared/components/design-system/tabs/types";
import { cn } from "@/shared/utils/cn";

export const PillTab = ({
  label,
  isActive = false,
  counter,
  onClick,
  className,
}: PillTabProps) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        // Base/layout
        "flex flex-col items-center gap-1",
        // Sizing — fixed padding from Figma (px-3 py-2 = 12px/8px)
        "px-3 py-2",
        // Typography — Roboto Mono, uppercase, tracked
        "font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.06em]",
        // Surfaces
        "bg-transparent",
        // Border — all sides, 1px
        "border",
        // Transitions
        "transition-colors duration-150",
        // Default state
        "text-secondary border-border-contrast cursor-pointer",
        // Hover state — surface-contrast bg
        !isActive && "hover:bg-surface-contrast",
        // Active state — highlight border + text
        isActive && "border-highlight text-link",
        className,
      )}
    >
      <span>{label}</span>

      {counter && (
        <span className="flex items-center gap-1.5 font-sans text-xs font-medium normal-case leading-4 tracking-normal">
          <span className="text-secondary">{counter.voters}</span>
          <span className="text-dimmed">/</span>
          <span className="text-secondary">{counter.vp}</span>
          <span className="text-dimmed">({counter.percentage})</span>
        </span>
      )}
    </button>
  );
};
