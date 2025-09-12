import { cn } from "@/shared/utils";

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th
      data-slot="table-head"
      className={cn("h-10 text-left [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
};
