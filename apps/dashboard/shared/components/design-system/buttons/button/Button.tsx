import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";
import {
  ButtonProps,
  ButtonSize,
} from "@/shared/components/design-system/buttons/types";
import { variantStyles } from "@/shared/components/design-system/buttons/styles";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-1 px-2",
  md: "py-2 px-4",
  lg: "py-3 px-6",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "size-3.5", // 14px
  md: "size-3.5", // 14px
  lg: "size-4", // 16px
};

// Export icon size styles for use in stories and other components
export { iconSizeStyles };

export const Button = ({
  children,
  className,
  disabled = false,
  onClick,
  size = "md",
  variant = "primary",
  loading = false,
  loadingText,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "disabled:text-dimmed disabled:bg-surface-disabled disabled:border-border-contrast flex h-fit cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm/tight font-medium transition-colors duration-300 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner label={loadingText} /> : children}
    </button>
  );
};
