import { cn } from "@/shared/utils";

export const TableWrapper = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => {
  return (
    <div className="md:border-light-dark relative w-full overflow-auto md:rounded-lg md:border">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
};
