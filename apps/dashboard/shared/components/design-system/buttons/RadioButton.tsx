import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { InputHTMLAttributes, forwardRef } from "react";
import {
  RadioIndicator,
  getRadioState,
} from "@/shared/components/design-system/buttons/RadioIndicator";

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
    const state = getRadioState(checked, disabled);

    return (
      <label
        className={cn(radioButtonVariants({ disabled }), "group", className)}
      >
        <RadioIndicator
          ref={ref}
          disabled={disabled}
          checked={checked}
          {...props}
        />

        {label && (
          <span
            className={cn(
              radioLabelVariants({ state }),
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
