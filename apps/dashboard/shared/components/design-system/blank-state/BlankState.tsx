"use client";

import { ElementType } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const blankStateVariants = cva(
  "rounded-md w-full flex items-center justify-center text-secondary px-3 py-4 gap-2 bg-surface-contrast",
  {
    variants: {
      variant: {
        default: " h-[92px] flex flex-col",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconVariants = cva("size-6", {
  variants: {
    variant: {
      default: "text-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BlankStateProps {
  variant: "default";
  icon: ElementType;
  className?: string;
  description: string;
}

export const BlankState = ({
  variant,
  icon: Icon,
  className,
  description,
}: BlankStateProps) => {
  return (
    <div className={cn(blankStateVariants({ variant }), className)}>
      <div className="flex">
        <Icon className={cn(iconVariants({ variant }))} />
      </div>
      <div className="text-secondary flex text-sm font-medium">
        {description}
      </div>
    </div>
  );
};
