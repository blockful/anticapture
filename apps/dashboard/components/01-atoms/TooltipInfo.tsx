"use client";

import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/client/utils";
import { InfoIcon } from "@/components/01-atoms";

const tooltipContentVariants = cva(
  "m-1 border-foreground bg-dark p-2 rounded-lg shadow-md",
  {
    variants: {
      variant: {
        default: "text-white",
        secondary: "text-secondary bg-secondary-light",
        destructive: "text-red-600 bg-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TooltipInfoProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof tooltipContentVariants> {
  text: string;
}

export function TooltipInfo({
  text,
  className,
  variant,
  ...props
}: TooltipInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent
        className={cn(tooltipContentVariants({ variant }), className)}
      >
        <p {...props}>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export { tooltipContentVariants };
