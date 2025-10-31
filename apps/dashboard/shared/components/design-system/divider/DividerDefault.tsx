"use client";

type DividerDefaultProps = {
  isVertical?: boolean;
  isHorizontal?: boolean;
};

export const DividerDefault = ({
  isVertical,
  isHorizontal,
}: DividerDefaultProps) => {
  if (isVertical) {
    return <div className="bg-surface-contrast h-full w-px" />;
  }
  if (isHorizontal) {
    return <div className="bg-surface-contrast h-px w-full" />;
  }
  return <div className="bg-surface-contrast h-px w-full" />;
};
