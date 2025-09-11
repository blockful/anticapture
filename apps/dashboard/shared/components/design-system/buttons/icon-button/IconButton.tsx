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
  sm: "size-3.5",
  md: "size-3.5",
  lg: "size-4",
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
          variantStyles[variant],
          boxSizeStyles[size],
          "flex h-fit cursor-pointer items-center justify-center gap-2 rounded-md text-sm/tight font-medium",
          disabled &&
            "bg-surface-disabled hover:bg-surface-disabled cursor-not-allowed",
          className,
        )}
        onClick={onClick}
        {...props}
      >
        {loading ? (
          <Spinner label={loadingText} />
        ) : (
          <Icon className={cn(iconSizeStyles[size], iconClassName)} />
        )}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
