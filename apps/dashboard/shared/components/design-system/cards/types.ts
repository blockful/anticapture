import type { ReactNode } from "react";

export type CardTitleProps = {
  text: string;
  isSmall?: boolean;
  hasIcon?: boolean;
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
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};
