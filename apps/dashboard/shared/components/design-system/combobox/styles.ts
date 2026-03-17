import type { ComboboxItemStatus } from "@/shared/components/design-system/combobox/types";

/**
 * Background styles per item status.
 * Default and unspecified states use surface-contrast;
 * hover/active/filter use surface-hover.
 */
export const itemStatusStyles: Record<ComboboxItemStatus, string> = {
  default: "bg-surface-contrast",
  hover: "bg-surface-hover",
  active: "bg-surface-hover",
  filter: "bg-surface-hover",
};
