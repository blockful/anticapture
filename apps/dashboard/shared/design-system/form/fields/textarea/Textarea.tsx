import * as React from "react";

import { cn } from "@/shared/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "border-border-contrast bg-surface-default text-primary placeholder:text-dimmed flex min-h-20 w-full border px-2.5 py-2 text-sm transition-all duration-200",
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
Textarea.displayName = "Textarea";

export { Textarea };
