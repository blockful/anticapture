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
        "md:border-light-dark relative w-full md:rounded-lg md:border",
        "overflow-auto",
        "md:overflow-y-hidden md:hover:overflow-y-auto",
        className,
      )}
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
