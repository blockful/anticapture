import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { InputHTMLAttributes, forwardRef } from "react";

const radioButtonVariants = cva(
  "relative flex items-center gap-2 cursor-pointer",
  {
    variants: {
      disabled: {
        true: "cursor-not-allowed opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

const radioIndicatorVariants = cva(
  "size-4 rounded-full border-2 transition-all duration-200 relative",
  {
    variants: {
      state: {
        default: "border-border-default bg-transparent",
        hover: "border-highlight bg-transparent",
        active: "border-highlight bg-highlight",
        disabled: "border-border-default bg-surface-disabled",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

const radioLabelVariants = cva("text-sm transition-colors duration-200", {
  variants: {
    state: {
      default: "text-secondary",
      hover: "text-primary",
      active: "text-primary",
      disabled: "text-dimmed",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

type RadioButtonProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  VariantProps<typeof radioButtonVariants> & {
    label: string;
    className?: string;
  };

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, disabled = false, checked, className, ...props }, ref) => {
    const getState = () => {
      if (disabled) return "disabled";
      if (checked) return "active";
      return "default";
    };

    return (
      <label
        className={cn(radioButtonVariants({ disabled }), "group", className)}
      >
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          checked={checked}
          className="sr-only"
          {...props}
        />

        <div
          className={cn(
            radioIndicatorVariants({ state: getState() }),
            !disabled && "group-hover:border-highlight",
            !disabled && !checked && "group-hover:bg-transparent",
          )}
        >
          {checked && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-surface-background size-2 rounded-full" />
            </div>
          )}
        </div>

        {label && (
          <span
            className={cn(
              radioLabelVariants({ state: getState() }),
              !disabled && "group-hover:text-primary",
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);

RadioButton.displayName = "RadioButton";
