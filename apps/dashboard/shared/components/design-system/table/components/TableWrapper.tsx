import { cn } from "@/shared/utils";
import { forwardRef } from "react";

export const TableWrapper = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "md:border-light-dark relative w-full md:rounded-lg md:border",
        "scrollbar-none overflow-x-auto overflow-y-auto",
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

TableWrapper.displayName = "TableWrapper";
