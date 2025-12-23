import * as React from "react";

import { cn } from "@/shared/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-border-default hover:border-border-contrast hover:bg-surface-contrast bg-surface-default text-primary placeholder:text-dimmed focus-visible:border-border-contrast flex h-9 w-full border px-2.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
