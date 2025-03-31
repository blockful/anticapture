"use client";

export const SkeletonRow = ({
  className,
  parentClassName,
}: {
  className: string;
  parentClassName?: string;
}) => {
  return (
    <div
      className={`${parentClassName || "flex animate-pulse justify-center space-x-2"} `}
    >
      <div className={`${className} rounded bg-gray-300`} />
    </div>
  );
};
