import * as React from "react";

import { cn } from "@/shared/utils/cn";

import type { FormLabelProps } from "./types";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, isRequired, isOptional, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-primary inline-flex items-center text-xs font-medium leading-4",
          className,
        )}
        {...props}
      >
        {children}
        {isRequired && !isOptional && (
          <span className="text-error ml-0 leading-[18px]">*</span>
        )}
        {isOptional && !isRequired && (
          <span className="text-secondary ml-1 font-normal leading-[18px]">
            (Optional)
          </span>
        )}
      </label>
    );
  },
);
FormLabel.displayName = "FormLabel";

export { FormLabel };
