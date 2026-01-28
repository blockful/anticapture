import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ElementType } from "react";

export type BadgeSize = "default" | "lg";

const sizeStyles: Record<BadgeSize, string> = {
  default: "size-6",
  lg: "size-10",
};

const iconSizeStyles: Record<BadgeSize, string> = {
  default: "size-3",
  lg: "size-4",
};

const badgeIconVariants = cva(
  "rounded-full h-5 gap-1.5 px-1.5 flex items-center text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-surface-action text-inverted",
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

type BadgeIconProps = VariantProps<typeof badgeIconVariants> & {
  icon: ElementType;
  className?: string;
  size?: BadgeSize;
  iconVariant?: VariantProps<typeof iconVariants>["variant"];
  iconClassName?: string;
  isLoading?: boolean;
};

export const BadgeIcon = ({
  variant,
  className,
  icon: Icon,
  iconVariant,
  iconClassName,
  size = "default",
  isLoading = false,
  ...props
}: BadgeIconProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-surface-hover size- size- h-5 w-28 animate-pulse rounded-full",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        badgeIconVariants({ variant }),
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <Icon
        className={cn(
          iconVariants({ variant: iconVariant }),
          iconSizeStyles[size],
          iconClassName,
        )}
      />
    </span>
  );
};
