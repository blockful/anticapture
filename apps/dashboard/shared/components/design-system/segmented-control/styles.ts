import type { SegmentedControlSize } from "@/shared/components/design-system/segmented-control/types";

/**
 * Size styles for SegmentedControlItem.
 *
 * From Figma:
 * - sm (isSmall=true): px-[6px] py-[2px], text-xs (12px/16px)
 * - md (isSmall=false): px-[12px] py-[6px], text-sm (14px/20px)
 */
export const sizeStyles: Record<SegmentedControlSize, string> = {
  // isSmall=true — 12px/16px, px-1.5 (6px), py-0.5 (2px)
  sm: "px-1.5 py-0.5 text-xs leading-4",
  // isSmall=false — 14px/20px, px-3 (12px), py-1.5 (6px)
  md: "px-3 py-1.5 text-sm leading-5",
};
