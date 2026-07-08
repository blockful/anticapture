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
        "border-border-default bg-surface-default rounded-lg border dark:rounded-none",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...rest }: CardProps) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...rest}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className, ...rest }: CardProps) => {
  return (
    <div className={cn("p-6 pt-0", className)} {...rest}>
      {children}
    </div>
  );
};

export const CardDescription = ({
  children,
  className,
  ...rest
}: CardProps) => {
  return (
    <div className={cn("text-secondary text-sm", className)} {...rest}>
      {children}
    </div>
  );
};
