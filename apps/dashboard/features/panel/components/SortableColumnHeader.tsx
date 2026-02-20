import { Column } from "@tanstack/react-table";
import { Button } from "@/shared/components";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils";

export const TitleUnderlined = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => {
  return (
    <h4
      className={cn(
        "text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px] transition-colors duration-300",
        className,
      )}
    >
      {title}
    </h4>
  );
};

interface SortableColumnHeaderProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  tooltipContent: string;
  className?: string;
}

export const SortableColumnHeader = <TData,>({
  column,
  title,
  tooltipContent,
  className,
}: SortableColumnHeaderProps<TData>) => {
  return (
    <div
      className={cn("flex w-full justify-end gap-2 px-0 text-right", className)}
    >
      <Tooltip
        tooltipContent={
          <div className="text-center">
            <p>{tooltipContent}</p>
          </div>
        }
      >
        <TitleUnderlined title={title} />
      </Tooltip>
      <Button
        variant="ghost"
        className="text-secondary hover:bg-surface-hover group justify-end px-1 py-1 text-right"
        onClick={() => column.toggleSorting()}
      >
        <ArrowUpDown
          props={{ className: "size-4 shrink-0" }}
          activeState={
            column.getIsSorted() === "asc"
              ? ArrowState.UP
              : column.getIsSorted() === "desc"
                ? ArrowState.DOWN
                : ArrowState.DEFAULT
          }
        />
      </Button>
    </div>
  );
};
