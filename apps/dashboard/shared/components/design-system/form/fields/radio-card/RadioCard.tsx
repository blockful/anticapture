import { CheckCircle2 } from "lucide-react";

import { RadioIndicator } from "@/shared/components/design-system/form/fields/radio-button/RadioIndicator";
import { cn } from "@/shared/utils/cn";

export type RadioCardProps = {
  label: string;
  hasIcon?: boolean;
  isRadioRight?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export const RadioCard = ({
  label,
  hasIcon = false,
  isRadioRight = false,
  isSelected = false,
  disabled = false,
  onClick,
  className,
}: RadioCardProps) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // Base layout
        "group flex w-full items-center gap-2 px-2.5 py-2",
        // Border
        "border",
        // Colors
        !isSelected && "bg-surface-default border-border-contrast",
        isSelected && "bg-surface-default border-highlight",
        // Hover
        !disabled && "hover:bg-surface-contrast",
        // Disabled
        disabled &&
          "bg-surface-contrast border-border-contrast cursor-not-allowed opacity-50",
        // Transition
        "transition-colors duration-200",
        // Radio right layout
        isRadioRight && "flex-row-reverse",
        className,
      )}
    >
      <RadioIndicator
        checked={isSelected}
        disabled={disabled}
        readOnly
        enableGroupHover
      />

      <div className="flex flex-1 items-center gap-2">
        {hasIcon && (
          <CheckCircle2
            className={cn(
              "size-3.5 shrink-0",
              disabled ? "text-dimmed" : "text-primary",
            )}
          />
        )}
        <span
          className={cn(
            "text-sm font-normal transition-colors duration-200",
            disabled ? "text-dimmed" : "text-primary",
          )}
        >
          {label}
        </span>
      </div>
    </button>
  );
};
