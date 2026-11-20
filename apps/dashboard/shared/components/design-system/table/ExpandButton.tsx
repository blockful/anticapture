import type { Row } from "@tanstack/react-table";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/shared/utils/cn";

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
        className="text-secondary hover:text-primary shrink-0 p-1 transition-colors"
      >
        {isExpanded ? (
          <Minus className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
      </button>
    );
  }

  // shrink-0: a long label in the same cell would otherwise squeeze the
  // spacer away and misalign the row against the ones that have a toggle.
  return <div className={cn("shrink-0", row.depth === 0 ? "w-6" : "w-2")} />;
};
