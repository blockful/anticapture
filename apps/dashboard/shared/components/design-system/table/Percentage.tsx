import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDown, ArrowUp } from "lucide-react";

const percentageVariants = cva(
  "flex items-center gap-0.5 transition-colors duration-300 text-sm font-normal",
  {
    variants: {
      variant: {
        positive: "text-success",
        negative: "text-error",
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
};

export const Percentage = ({ className, value, ...props }: PercentageProps) => {
  const variant = value >= 0 ? "positive" : "negative";
  const formattedValue = `${Math.abs(value)}%`;

  if (value === 0) {
    return null;
  }

  return (
    <span className={cn(percentageVariants({ variant }), className)} {...props}>
      {value > 0 ? (
        <ArrowUp
          className={cn("size-4", variant === "positive" && "text-success")}
        />
      ) : (
        <ArrowDown
          className={cn("size-4", variant === "negative" && "text-error")}
        />
      )}
      {formattedValue}
    </span>
  );
};
