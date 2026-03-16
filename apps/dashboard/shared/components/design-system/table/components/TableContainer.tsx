import { forwardRef } from "react";

import { cn } from "@/shared/utils/cn";

export const TableContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tableClassName?: string }
>(({ className, tableClassName, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "lg:border-light-dark scrollbar-thin relative w-full overflow-auto lg:border",
        className,
      )}
      style={{
        // Safari mobile: enable smooth scrolling
        WebkitOverflowScrolling: "touch",
      }}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", tableClassName)}
        {...props}
      />
    </div>
  );
});

TableContainer.displayName = "TableContainer";
