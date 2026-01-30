import { cn } from "@/shared/utils";
import { forwardRef } from "react";

export const TableContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "lg:border-light-dark scrollbar-thin relative w-full overflow-y-auto lg:border",
        className,
      )}
      style={{
        // Safari mobile: enable smooth scrolling
        WebkitOverflowScrolling: "touch",
      }}
    >
      <table
        data-slot="table"
        className={"w-full caption-bottom text-sm"}
        {...props}
      />
    </div>
  );
});

TableContainer.displayName = "TableContainer";
