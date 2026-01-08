import { cn } from "@/shared/utils";

type DividerDefaultProps = {
  isVertical?: boolean;
  isHorizontal?: boolean;
  className?: string;
};

export const DividerDefault = ({
  isVertical,
  isHorizontal,
  className,
}: DividerDefaultProps) => {
  if (isVertical) {
    return <div className={cn("bg-surface-contrast h-full w-px", className)} />;
  }
  if (isHorizontal) {
    return <div className={cn("bg-surface-contrast h-px w-full", className)} />;
  }
  return <div className={cn("bg-surface-contrast h-px w-full", className)} />;
};
