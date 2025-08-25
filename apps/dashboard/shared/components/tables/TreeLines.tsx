import { Row } from "@tanstack/react-table";

interface TreeLinesProps<TData> {
  row: Row<TData>;
}

interface TreeNodeInfo {
  isLastChild: boolean;
  hasMoreSiblings: boolean;
}

/**
 * Utility functions for tree structure analysis
 */
const getTreeNodeInfo = <TData,>(row: Row<TData>): TreeNodeInfo => {
  const parentRow = row.getParentRow();
  if (!parentRow) {
    return { isLastChild: true, hasMoreSiblings: false };
  }

  const parentOriginal = parentRow.original as Row<TData>;
  const siblings = parentOriginal.subRows || [];
  const currentRowId = (row.original as Row<TData>).id;
  const currentPosition = siblings.findIndex(
    (sibling: Row<TData>) => sibling.id === currentRowId,
  );

  const isLastChild = currentPosition === siblings.length - 1;
  const hasMoreSiblings =
    currentPosition !== -1 && currentPosition < siblings.length - 1;

  return { isLastChild, hasMoreSiblings };
};

const getAncestorInfo = <TData,>(
  row: Row<TData>,
  depthLevel: number,
): TreeNodeInfo => {
  let ancestorAtLevel: Row<TData> = row;

  // Walk up the tree to find the ancestor at the specified depth level
  for (let i = row.depth - 1; i > depthLevel; i--) {
    const parent = ancestorAtLevel.getParentRow();
    if (!parent) break;
    ancestorAtLevel = parent;
  }

  return getTreeNodeInfo(ancestorAtLevel);
};

/**
 * Component for rendering tree connector lines (L-shaped and T-shaped)
 */
const TreeConnector = <TData,>({ row }: { row: Row<TData> }) => {
  const { hasMoreSiblings } = getTreeNodeInfo(row);

  return (
    <>
      {/* Vertical line from top to middle */}
      <div
        className="border-border-contrast absolute left-[80%] border-l"
        style={{
          top: "-32px",
          height: "calc(50% + 32px)",
        }}
      />

      {/* Horizontal line to the right */}
      <div
        className="border-border-contrast absolute left-[80%] top-1/2 border-t"
        style={{ width: "25%" }}
      />

      {/* Vertical line from middle to bottom - only for non-last children (T-shaped) */}
      {hasMoreSiblings && (
        <div
          className="border-border-contrast absolute left-[80%] border-l"
          style={{
            top: "50%",
            height: "calc(50% + 32px)",
          }}
        />
      )}
    </>
  );
};

/**
 * Component for rendering ancestor vertical lines
 */
const AncestorLine = <TData,>({
  row,
  depthLevel,
}: {
  row: Row<TData>;
  depthLevel: number;
}) => {
  const { hasMoreSiblings } = getAncestorInfo(row, depthLevel);

  if (!hasMoreSiblings) return null;

  return (
    <div
      className="border-border-contrast absolute left-[80%] border-l"
      style={{
        top: "-16px",
        height: "calc(100% + 48px)",
      }}
    />
  );
};

/**
 * Main TreeLines component
 */
export const TreeLines = <TData,>({ row }: TreeLinesProps<TData>) => {
  if (row.depth === 0) return null;

  return (
    <div className="flex">
      {Array.from({ length: row.depth }).map((_, depthIndex) => {
        const isCurrentLevel = depthIndex === row.depth - 1;

        return (
          <div
            key={depthIndex}
            className="relative flex items-center justify-center"
            style={{ width: "2rem", height: "100%" }}
          >
            {isCurrentLevel ? (
              <TreeConnector row={row} />
            ) : (
              <AncestorLine row={row} depthLevel={depthIndex} />
            )}
          </div>
        );
      })}
    </div>
  );
};
