"use client";

import { ElementType, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const blankStateVariants = cva(
  "rounded-md w-full flex items-center justify-center text-secondary px-3 py-4 gap-2 bg-surface-contrast",
  {
    variants: {
      variant: {
        default: " h-fit flex flex-col",
        title: " h-fit flex flex-col",
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
      title: "text-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BlankStateProps {
  variant: "default" | "title";
  icon: ElementType;
  title?: string;
  className?: string;
  description: string;
  children?: ReactNode;
}

export const BlankState = ({
  variant,
  icon: Icon,
  title,
  className,
  description,
  children,
}: BlankStateProps) => {
  return (
    <div className={cn(blankStateVariants({ variant }), className)}>
      <div className="flex">
        <Icon className={cn(iconVariants({ variant }))} />
      </div>
      {title && (
        <div className="text-primary flex font-mono text-[13px] text-sm font-medium uppercase leading-[20px]">
          {title}
        </div>
      )}
      <div className="text-secondary font-regular flex text-sm">
        {description}
      </div>
      {children}
    </div>
  );
};
