import { cn } from "@/shared/utils";

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      data-slot="table-cell"
      className={cn("bg-light p-0", className)}
      {...props}
    />
  );
};
