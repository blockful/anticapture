import { Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasIcon?: boolean;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasIcon, error, ...props }, ref) => {
    const inputClasses = cn(
      "bg-transparent text-primary placeholder:text-dimmed flex-1 text-sm outline-none",
      "disabled:cursor-not-allowed disabled:text-secondary",
    );

    const containerClasses = cn(
      "border-border-contrast bg-surface-default flex h-9 w-full items-center gap-2.5 border px-2.5 py-2 transition-all duration-200",
      //enabled
      "has-[:enabled]:hover:bg-surface-contrast",
      //focused
      "has-[:focus-visible]:border-border-contrast has-[:focus-visible]:shadow-[0px_0px_0px_2px_rgba(82,82,91,0.3)]",
      //disabled
      "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:bg-surface-disabled has-[:disabled]:border-border-default",
      //error
      error && "border-error",
      className,
    );

    if (hasIcon) {
      return (
        <div className={containerClasses}>
          <Search className="text-dimmed size-3.5 shrink-0" />
          <input type={type} className={inputClasses} ref={ref} {...props} />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "border-border-contrast bg-surface-default text-primary placeholder:text-dimmed flex h-9 w-full border px-2.5 py-2 text-sm transition-all duration-200",
          //enabled
          "enabled:hover:bg-surface-contrast",
          //focused
          "focus-visible:border-border-contrast focus-visible:shadow-[0px_0px_0px_2px_rgba(82,82,91,0.3)] focus-visible:outline-none",
          //disabled
          "disabled:bg-surface-disabled disabled:border-border-default disabled:text-secondary disabled:cursor-not-allowed disabled:opacity-50",
          //error
          error && "border-error",
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
