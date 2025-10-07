import { cn } from "@/shared/utils";

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-surface-contrast font-medium [&_th:first-child]:border-r [&_th:first-child]:border-white/10 md:[&_th]:border-none [&_tr]:border-b",
        className,
      )}
      {...props}
    />
  );
};
