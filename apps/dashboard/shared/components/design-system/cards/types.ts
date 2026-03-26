import type { ReactNode } from "react";

export type CardTitleProps = {
  text: string;
  size?: "small" | "default";
  icon?: ReactNode;
  avatar?: ReactNode;
  badge?: ReactNode;
  className?: string;
};

export type ClickableCardProps = {
  title: string;
  avatar?: ReactNode;
  subtitle?: string;
  description?: string;
  badge?: ReactNode;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
};
