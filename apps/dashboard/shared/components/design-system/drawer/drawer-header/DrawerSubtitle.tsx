"use client";

import type { DrawerSubtitleProps } from "@/shared/components/design-system/drawer/types";

/** @internal Used internally by DrawerHeader. Not part of the public API. */
export const DrawerSubtitle = ({ children }: DrawerSubtitleProps) => {
  return (
    <span className="text-secondary font-mono text-xs font-medium uppercase tracking-wide">
      {children}
    </span>
  );
};
