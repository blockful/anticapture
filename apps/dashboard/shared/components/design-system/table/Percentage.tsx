import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/shared/utils";

export const percentageVariants = cva(
  "flex items-center gap-0.5 transition-colors duration-300 text-sm font-normal",
  {
    variants: {
      variant: {
        positive: "text-success",
        negative: "text-error",
        neutral: "text-dimmed",
      },
    },
    defaultVariants: {
      variant: "positive",
    },
  },
);

type PercentageProps = Omit<
  VariantProps<typeof percentageVariants>,
  "variant"
> & {
  className?: string;
  value: number;
  iconPosition?: "left" | "right";
};

export const Percentage = ({
  className,
  value,
  iconPosition = "left",
  ...props
}: PercentageProps) => {
  if (value === 0)
    return (
      <span
        className={cn(percentageVariants({ variant: "neutral" }), className)}
        {...props}
      >
        0%
      </span>
    );
  const variant = value >= 0 ? "positive" : "negative";

  const icon =
    value > 0 ? (
      <ArrowUp
        className={cn("size-4", variant === "positive" && "text-success")}
      />
    ) : (
      <ArrowDown
        className={cn("size-4", variant === "negative" && "text-error")}
      />
    );

  return (
    <span className={cn(percentageVariants({ variant }), className)} {...props}>
      {iconPosition === "left" && icon}
      {value > 1000 ? "> 1000" : value < -1000 ? "< -1000" : Math.abs(value)}%
      {iconPosition === "right" && icon}
    </span>
  );
};
