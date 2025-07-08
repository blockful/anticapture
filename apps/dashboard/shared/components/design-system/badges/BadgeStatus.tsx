import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

const badgeStatusVariants = cva(
  "rounded-full h-5 gap-1.5 px-1.5 flex items-center text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-surface-action-primary text-inverted",
        secondary: "bg-surface-hover text-primary",
        error: "bg-surface-opacity-error text-error",
        outline: "border-surface-contrast text-secondary",
        dimmed: "bg-surface-opacity text-secondary",
        warning: "bg-surface-opacity-warning text-warning",
        success: "bg-surface-opacity-success text-success",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

const iconVariants = cva("size-3", {
  variants: {
    variant: {
      primary: "text-inverted",
      secondary: "text-primary",
      error: "text-error",
      outline: "text-secondary",
      dimmed: "text-secondary",
      warning: "text-warning",
      success: "text-success",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type BadgeStatusProps = VariantProps<typeof badgeStatusVariants> & {
  children?: ReactNode;
  className?: string;
  hasIcon?: boolean;
};

export const BadgeStatus = ({
  children,
  variant,
  className,
  hasIcon = false,
  ...props
}: BadgeStatusProps) => {
  return (
    <span
      className={cn(badgeStatusVariants({ variant }), className)}
      {...props}
    >
      {hasIcon && <CheckCircle2 className={cn(iconVariants({ variant }))} />}
      {children}
    </span>
  );
};
