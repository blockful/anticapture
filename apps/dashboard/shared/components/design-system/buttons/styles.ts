import { ButtonVariant } from "@/shared/components/design-system/buttons/types";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-surface-action border border-transparent text-inverted hover:bg-surface-action-hover",
  outline:
    "border border-border-contrast text-primary bg-surface-default hover:bg-surface-contrast",
  ghost:
    "bg-transparent text-primary hover:bg-surface-contrast disabled:text-border-contrast disabled:bg-transparent",
  destructive:
    "border border-transparent bg-surface-destructive text-primary hover:bg-surface-destructive-hover",
};
