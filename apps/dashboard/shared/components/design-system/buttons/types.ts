import { ButtonHTMLAttributes } from "react";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}
