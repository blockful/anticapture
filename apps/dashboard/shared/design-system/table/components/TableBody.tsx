import { cn } from "@/shared/utils";

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn("scrollbar-none [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
};
