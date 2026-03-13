"use client";

import type { DrawerBodyProps } from "@/shared/components/design-system/drawer/types";
import { cn } from "@/shared/utils";

export const DrawerBody = ({ children, className }: DrawerBodyProps) => {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      {children}
    </div>
  );
};
