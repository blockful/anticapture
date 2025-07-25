"use client";

export const SkeletonRow = ({
  className,
  parentClassName,
}: {
  className?: string;
  parentClassName?: string;
}) => {
  return (
    <div
      className={`${parentClassName || "flex animate-pulse justify-center space-x-2"} `}
    >
      <div className={`${className} bg-surface-contrast rounded-sm`} />
    </div>
  );
};
