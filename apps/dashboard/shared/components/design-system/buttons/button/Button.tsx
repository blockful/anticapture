import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";
import {
  ButtonProps,
  ButtonSize,
} from "@/shared/components/design-system/buttons/types";
import { variantStyles } from "@/shared/components/design-system/buttons/styles";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-2",
  md: "h-9 px-4",
  lg: "h-11 px-6",
};

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
        variantStyles[variant],
        sizeStyles[size],
        "flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm/tight font-medium",
        disabled &&
          "bg-surface-disabled hover:bg-surface-disabled cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {loading ? <Spinner label={loadingText} /> : children}
    </button>
  );
};
