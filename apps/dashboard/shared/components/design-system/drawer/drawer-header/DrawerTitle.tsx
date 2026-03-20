"use client";

import { cn } from "@/shared/utils/cn";

import type { DrawerTitleProps } from "@/shared/components/design-system/drawer/types";

/** @internal Used internally by DrawerHeader. Not part of the public API. */
export const DrawerTitle = ({ children, className }: DrawerTitleProps) => {
  if (typeof children === "string") {
    return (
      <span
        className={cn("text-primary text-lg font-medium leading-6", className)}
      >
        {children}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {children}
    </div>
  );
};
