import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Filter } from "lucide-react";

const buttonFilterVariants = cva(
  "group flex cursor-pointer items-center rounded-sm border p-1 transition-colors",
  {
    variants: {
      variant: {
        default: "text-primary",
      },
      isActive: {
        true: "border-highlight bg-surface-hover",
        false: "border-transparent hover:border-highlight bg-surface-hover",
      },
    },
    defaultVariants: {
      variant: "default",
      isActive: false,
    },
  },
);

type ButtonFilterProps = VariantProps<typeof buttonFilterVariants> & {
  className?: string;
  onClick: () => void;
  isActive?: boolean;
};

export const ButtonFilter = ({
  variant,
  className,
  onClick,
  isActive,
  ...props
}: ButtonFilterProps) => {
  return (
    <button
      className={cn(buttonFilterVariants({ variant, isActive }), className)}
      {...props}
      onClick={onClick}
    >
      <Filter className="text-primary size-3" />
    </button>
  );
};
