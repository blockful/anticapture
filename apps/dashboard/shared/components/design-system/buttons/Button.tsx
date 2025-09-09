import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onClick?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-2",
  md: "h-9 px-4",
  lg: "h-11 px-6",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-surface-action text-inverted hover:bg-surface-action-hover",
  secondary: "bg-surface-contrast text-primary hover:bg-surface-hover",
  outline:
    "border border-border-contrast text-primary bg-surface-default hover:bg-surface-contrast",
  ghost: "bg-transparent text-primary hover:bg-surface-contrast",
  destructive:
    "bg-surface-destructive text-primary hover:bg-surface-destructive-hover",
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
