import { cn } from "@/shared/utils/cn";

export type SkeletonShape = "rectangle" | "circle" | "text";

export type SkeletonProps = {
  /** Controls the shape of the skeleton element */
  shape?: SkeletonShape;
  /** Additional CSS classes — use w-* and h-* to control dimensions */
  className?: string;
};

const shapeStyles: Record<SkeletonShape, string> = {
  rectangle: "",
  circle: "rounded-full",
  text: "",
};

export const Skeleton = ({ shape = "rectangle", className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        // Base
        "bg-surface-contrast animate-pulse",
        // Shape
        shapeStyles[shape],
        // Dimensions and overrides
        className,
      )}
    />
  );
};
