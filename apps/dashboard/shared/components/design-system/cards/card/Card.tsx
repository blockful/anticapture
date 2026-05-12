import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className, ...rest }: CardProps) => {
  return (
    <div
      className={cn(
        "border-border-default bg-surface-default rounded-lg border",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
