"use client";

import { ElementType, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const blankSlateVariants = cva(
  "rounded-md w-full flex items-center justify-center text-secondary px-3 py-4 gap-2 bg-surface-contrast",
  {
    variants: {
      variant: {
        default: "h-fit flex flex-col",
        title: "h-fit flex flex-col",
        small: "h-fit flex p-3",
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
      small: "text-secondary size-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BlankSlateProps {
  variant: "default" | "title" | "small";
  icon: ElementType;
  title?: string;
  className?: string;
  description: string;
  children?: ReactNode;
}

export const BlankSlate = ({
  variant,
  icon: Icon,
  title,
  className,
  description,
  children,
}: BlankSlateProps) => {
  return (
    <div className={cn(blankSlateVariants({ variant }), className)}>
      <div className="flex">
        <Icon className={cn(iconVariants({ variant }))} />
      </div>
      <div className="flex flex-col items-center justify-center">
        {title && (
          <div className="text-primary flex font-mono text-[13px] text-sm font-medium uppercase leading-[20px]">
            {title}
          </div>
        )}
        <div
          className={cn("text-secondary font-regular flex text-sm", {
            "font-normal": variant === "small",
          })}
        >
          {description}
        </div>
      </div>

      {children}
    </div>
  );
};
