import { cn } from "@/shared/utils/cn";

import type { DividerDefaultProps } from "./types";

export const DividerDefault = ({
  isVertical,
  isHorizontal,
  isDashed,
  className,
}: DividerDefaultProps) => {
  if (isVertical) {
    return (
      <div
        className={cn(
          "border-border-contrast h-full w-px",
          isDashed
            ? "border-l border-dashed bg-transparent"
            : "bg-surface-contrast",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "border-border-contrast w-full",
        isDashed
          ? "border-t border-dashed bg-transparent"
          : "bg-surface-contrast h-px",
        isHorizontal && !isDashed && "h-px",
        className,
      )}
    />
  );
};
