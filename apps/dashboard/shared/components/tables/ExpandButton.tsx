import { Row } from "@tanstack/react-table";
import { Minus, Plus } from "lucide-react";

interface ExpandButtonProps<TData> {
  row: Row<TData>;
  enableExpanding: boolean;
}

export const ExpandButton = <TData,>({
  row,
  enableExpanding,
}: ExpandButtonProps<TData>) => {
  if (!enableExpanding) return null;

  const canExpand = row.getCanExpand();
  const isExpanded = row.getIsExpanded();

  if (canExpand) {
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

  // Spacer for alignment
  return <div className={row.depth === 0 ? "w-6" : "w-2"} />;
};
