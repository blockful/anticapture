import type { ReactNode } from "react";

import { RadioIndicator } from "@/shared/components/design-system/form/fields/radio-button/RadioIndicator";
import { cn } from "@/shared/utils/cn";

export type RadioCardProps = {
  label: string;
  icon?: ReactNode;
  placementRight?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export const RadioCard = ({
  label,
  icon,
  placementRight = false,
  isActive = false,
  isDisabled = false,
  onClick,
  className,
}: RadioCardProps) => {
  return (
    <label
      aria-disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={cn(
        // Base layout
        "group flex w-full items-center gap-2 px-2.5 py-2",
        // Border
        "rounded-base border",
        // Colors
        !isActive && "bg-surface-default border-border-contrast",
        isActive && "bg-surface-default border-highlight",
        // Hover
        !isDisabled && "hover:bg-surface-contrast",
        // Disabled
        isDisabled &&
          "bg-surface-contrast border-border-contrast pointer-events-none cursor-not-allowed opacity-50",
        // Transition
        "transition-colors duration-200",
        // Radio right layout
        placementRight && "flex-row-reverse",
        className,
      )}
    >
      <RadioIndicator
        checked={isActive}
        disabled={isDisabled}
        readOnly
        enableGroupHover
      />

      <div className="flex flex-1 items-center gap-2">
        {icon && (
          <span
            className={cn(
              "shrink-0",
              isDisabled ? "text-dimmed" : "text-primary",
            )}
          >
            {icon}
          </span>
        )}
        <span
          className={cn(
            "text-sm font-normal transition-colors duration-200",
            isDisabled ? "text-dimmed" : "text-primary",
          )}
        >
          {label}
        </span>
      </div>
    </label>
  );
};
