import type { ReactNode } from "react";

export type TooltipProps = {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
  triggerClassName?: string;
  title?: ReactNode;
  titleRight?: ReactNode;
  asChild?: boolean;
  disableMobileClick?: boolean;
};
