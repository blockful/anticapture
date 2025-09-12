import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, ElementType, ReactNode } from "react";

/*This component need to be refactored to use the new design system. */
const buttonVariants = cva("flex items-center justify-center cursor-pointer", {
  variants: {
    variant: {
      primary: "",
      secondary: "",
      outline:
        "bg-surface-default border border-[#3F3F46] text-primary disabled:bg-surface-disabled disabled:text-dimmed rounded-md ",
      ghost: "",
      destructive: "",
      link: "",
    },
    size: {
      default: "size-8",
      sm: "size-7",
      lg: "size-10",
      icon: "size-3.5",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

type TheButtonProps = VariantProps<typeof buttonVariants> &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
    hasText?: boolean;
    hasIcon?: boolean;
    icon?: ElementType;
  };

export const TheButton = ({
  variant,
  className,
  children,
  onClick,
  hasIcon = true,
  icon: Icon,
  disabled = false,
  ...props
}: TheButtonProps) => {
  return (
    <button
      className={cn(
        buttonVariants({ variant }),
        className,
        disabled && "bg-surface-disabled cursor-default",
      )}
      {...props}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {hasIcon && Icon && <Icon className="size-4" />}
    </button>
  );
};
