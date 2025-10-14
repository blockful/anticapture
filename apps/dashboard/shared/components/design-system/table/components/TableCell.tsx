import { cn } from "@/shared/utils";

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      data-slot="table-cell"
      className={cn("bg-light h-auto w-auto p-4", className)}
      {...props}
    />
  );
};
