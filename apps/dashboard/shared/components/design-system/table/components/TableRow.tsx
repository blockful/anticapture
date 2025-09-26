import { cn } from "@/shared/utils";

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-accent data-[state=selected]:bg-muted border-b transition-colors [&_td:first-child]:border-r [&_td:first-child]:border-white/10 md:[&_td:first-child]:border-none",
        // "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10",
        // "[&_td:first-child]:shadow-[2px_0px_8px_2px_rgba(0,0,0,1.00)] sm:[&_td:first-child]:shadow-none",
        className,
      )}
      {...props}
    />
  );
};
