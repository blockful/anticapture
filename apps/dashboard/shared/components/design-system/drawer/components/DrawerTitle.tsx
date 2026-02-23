"use client";

import type { DrawerTitleProps } from "@/shared/components/design-system/drawer/types";

export const DrawerTitle = ({ children }: DrawerTitleProps) => {
  if (typeof children === "string") {
    return (
      <span className="text-primary text-lg font-medium leading-6">
        {children}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">{children}</div>
  );
};
