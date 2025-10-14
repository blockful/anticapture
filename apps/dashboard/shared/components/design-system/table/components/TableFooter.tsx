import { cn } from "@/shared/utils";

export const TableFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-accent border-t font-medium last:[&>tr]:border-b-0",
        className,
      )}
      {...props}
    />
  );
};
