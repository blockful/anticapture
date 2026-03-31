import type { TabSize } from "@/shared/components/design-system/tabs/types";

export const sizeStyles: Record<TabSize, string> = {
  // isSmall=true — 12px/16px, padding-md (8px), gap text-gap-sm (4px)
  sm: "gap-1 p-2 text-xs leading-4",
  // isSmall=false — 14px/20px, padding-lg (10px), gap (6px)
  md: "gap-1.5 p-2.5 text-sm leading-5",
};
