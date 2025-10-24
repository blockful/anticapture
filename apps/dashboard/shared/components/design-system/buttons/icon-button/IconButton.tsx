import { forwardRef, ElementType } from "react";
import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";
import {
  ButtonSize,
  ButtonProps,
} from "@/shared/components/design-system/buttons/types";
import { variantStyles } from "@/shared/components/design-system/buttons/styles";

interface IconButtonProps extends ButtonProps {
  icon: ElementType;
  iconClassName?: string;
}

const boxSizeStyles: Record<ButtonSize, string> = {
  sm: "p-1",
  md: "p-2",
  lg: "p-3",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "size-3.5", // 14px
  md: "size-3.5", // 14px
  lg: "size-4", // 16px
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      iconClassName,
      className,
      disabled = false,
      onClick,
      size = "md",
      variant = "primary",
      loading = false,
      loadingText,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "disabled:text-dimmed disabled:bg-surface-disabled disabled:border-border-contrast flex h-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm/tight font-medium transition-colors duration-300",
          variantStyles[variant],
          boxSizeStyles[size],
          className,
        )}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner label={loadingText} />
        ) : (
          <Icon
            className={cn(iconSizeStyles[size], iconClassName, "shrink-0")}
          />
        )}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
