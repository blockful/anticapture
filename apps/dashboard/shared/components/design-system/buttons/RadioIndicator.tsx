import { cva } from "class-variance-authority";
import { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/shared/utils";

const radioIndicatorVariants = cva(
  "size-4 rounded-full border-2 transition-all duration-200 relative bg-transparent shrink-0",
  {
    variants: {
      state: {
        default: "border-secondary",
        hover: "border-highlight",
        active: "border-highlight",
        disabled: "bg-surface-disabled border-transparent",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

type RadioIndicatorState = "default" | "hover" | "active" | "disabled";

export type RadioIndicatorProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  indicatorClassName?: string;
  enableGroupHover?: boolean;
};

export const getRadioState = (
  checked: boolean | undefined,
  disabled: boolean | undefined,
): RadioIndicatorState => {
  if (disabled) return "disabled";
  if (checked) return "active";
  return "default";
};

export const RadioIndicator = forwardRef<HTMLInputElement, RadioIndicatorProps>(
  (
    {
      checked,
      disabled,
      className,
      indicatorClassName,
      enableGroupHover = true,
      ...props
    },
    ref,
  ) => {
    const state = getRadioState(checked, disabled);

    return (
      <>
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          checked={checked}
          className={cn("sr-only", className)}
          {...props}
        />

        <div
          className={cn(
            radioIndicatorVariants({ state }),
            enableGroupHover && !disabled && "group-hover:border-highlight",
            indicatorClassName,
          )}
        >
          {checked && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-highlight size-2 rounded-full" />
            </div>
          )}
        </div>
      </>
    );
  },
);

RadioIndicator.displayName = "RadioIndicator";
