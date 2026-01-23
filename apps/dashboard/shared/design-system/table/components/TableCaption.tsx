import { cn } from "@/shared/utils";

export const TableCaption = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-accent mt-4 text-sm", className)}
      {...props}
    />
  );
};
