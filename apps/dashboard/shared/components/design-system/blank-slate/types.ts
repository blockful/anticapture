import type { ElementType, ReactNode } from "react";

export type BlankSlateProps = {
  variant: "default" | "title" | "small";
  icon: ElementType;
  title?: string;
  className?: string;
  description: string;
  children?: ReactNode;
};
