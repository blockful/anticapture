import { ButtonVariant } from "@/shared/components/design-system/buttons/types";

export const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-surface-action text-inverted hover:bg-surface-action-hover",
  outline:
    "border border-border-contrast text-primary bg-surface-default hover:bg-surface-contrast",
  ghost: "bg-transparent text-primary hover:bg-surface-contrast",
  destructive:
    "bg-surface-destructive text-primary hover:bg-surface-destructive-hover",
};
