import { Row } from "@tanstack/react-table";
import { Minus, Plus } from "lucide-react";

interface ExpandButtonProps<TData> {
  row: Row<TData>;
  enableExpanding: boolean;
}

export type ExpandableData = {
  subRows?: unknown[];
};

export const ExpandButton = <TData extends ExpandableData>({
  row,
  enableExpanding,
}: ExpandButtonProps<TData>) => {
  if (!enableExpanding) return null;
  const canExpand = row.getCanExpand();
  const isExpanded = row.getIsExpanded();
  const subRows = row.original.subRows;
  const hasOnlyOneSubRow = subRows && subRows.length === 1;

  if (canExpand && !hasOnlyOneSubRow) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          row.getToggleExpandedHandler()();
        }}
        className="text-secondary hover:text-primary p-1 transition-colors"
      >
        {isExpanded ? (
          <Minus className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
      </button>
    );
  }

  return <div className={row.depth === 0 ? "w-6" : "w-2"} />;
};
