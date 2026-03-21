import { cn } from "@/shared/utils/cn";

import type { BulletDividerProps } from "@/shared/components/design-system/section/types";

export const BulletDivider = ({ className }: BulletDividerProps) => {
  return (
    <div className={cn("bg-surface-hover size-1 rounded-full", className)} />
  );
};
