import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, ElementType, ReactNode } from "react";

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

type ButtonProps = VariantProps<typeof buttonVariants> &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    children?: ReactNode;
    onClick?: () => void;
    hasText?: boolean;
    hasIcon?: boolean;
    icon?: ElementType;
    size?: "default" | "sm" | "lg" | "icon";
  };

export const Button = ({
  variant,
  className,
  children,
  onClick,
  hasIcon = true,
  icon: Icon,
  disabled = false,
  size = "default",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        className,
        disabled && "bg-surface-disabled cursor-default",
      )}
      {...props}
      onClick={onClick}
    >
      {children}
      {hasIcon && Icon && <Icon className="size-4" />}
    </button>
  );
};
