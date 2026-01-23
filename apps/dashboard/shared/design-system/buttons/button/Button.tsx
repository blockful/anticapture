import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";
import { ButtonProps, ButtonSize } from "@/shared/design-system/buttons/types";
import { variantStyles } from "@/shared/design-system/buttons/styles";

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
  asChild = false,
  ...props
}: ButtonProps) => {
  // When loading is true, we can't use asChild because we need to render Spinner
  // Fall back to button element in this case
  const Comp = asChild && !loading ? Slot : "button";

  const isDisabled = disabled || loading;

  return (
    <Comp
      className={cn(
        "disabled:text-dimmed disabled:bg-surface-disabled disabled:border-border-contrast flex h-fit cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm/tight font-medium transition-colors duration-300 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && !asChild && "pointer-events-none opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={!asChild && isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? <Spinner label={loadingText} /> : children}
    </Comp>
  );
};
