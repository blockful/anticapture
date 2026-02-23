import { cva, type VariantProps } from "class-variance-authority";
import { Filter } from "lucide-react";

import { cn } from "@/shared/utils";

const buttonFilterVariants = cva(
  "group flex cursor-pointer items-center border p-1 transition-colors bg-surface-hover",
  {
    variants: {
      variant: {
        default: "text-primary",
      },
      isOpen: {
        true: "border-highlight",
        false: "border-transparent hover:border-highlight",
      },
    },
    defaultVariants: {
      variant: "default",
      isOpen: false,
    },
  },
);

type ButtonFilterProps = VariantProps<typeof buttonFilterVariants> & {
  className?: string;
  onClick: () => void;
  isOpen?: boolean;
  hasFilters?: boolean;
};

export const ButtonFilter = ({
  variant,
  className,
  onClick,
  isOpen,
  hasFilters,
  ...props
}: ButtonFilterProps) => {
  return (
    <div className="relative inline-block">
      <button
        className={cn(buttonFilterVariants({ variant, isOpen }), className)}
        {...props}
        onClick={onClick}
      >
        <Filter className="text-primary size-3" />
      </button>
      {hasFilters && (
        <div className="pointer-events-none absolute left-3 top-0.5 size-4">
          <div className="bg-highlight size-2 rounded-full" />
        </div>
      )}
    </div>
  );
};
