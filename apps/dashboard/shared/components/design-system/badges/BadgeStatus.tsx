import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ElementType, ReactNode } from "react";

const badgeStatusVariants = cva(
  "rounded-full h-5 gap-1.5 px-1.5 flex items-center text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-surface-action-primary text-inverted",
        secondary: "bg-surface-hover text-primary",
        error: "bg-surface-opacity-error text-error",
        outline:
          "border-surface-contrast text-secondary border-1 border-border-contrast",
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
  icon?: ElementType;
  iconVariant?: VariantProps<typeof iconVariants>["variant"];
  isLoading?: boolean;
};

export const BadgeStatus = ({
  children,
  variant,
  className,
  icon: Icon,
  iconVariant,
  isLoading = false,
  ...props
}: BadgeStatusProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-surface-hover h-5 w-28 animate-pulse rounded-full",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(badgeStatusVariants({ variant }), className)}
      {...props}
    >
      {Icon && <Icon className={cn(iconVariants({ variant: iconVariant }))} />}
      {children}
    </span>
  );
};
