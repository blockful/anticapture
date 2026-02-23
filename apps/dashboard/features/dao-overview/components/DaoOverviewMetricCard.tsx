import { ReactNode } from "react";

import { SkeletonRow } from "@/shared/components";
import { cn } from "@/shared/utils";

export const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
  className,
  textClassName,
  isLoading = false,
}: {
  title: string | ReactNode;
  text: string | ReactNode;
  subText?: string | ReactNode;
  className?: string;
  textClassName?: string;
  isLoading?: boolean;
}) => (
  <div
    className={cn(
      "lg:bg-surface-default flex flex-col justify-start lg:p-3",
      className,
    )}
  >
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    {isLoading ? (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-start w-full"
        className="bg-surface-hover h-4 w-20"
      />
    ) : (
      <p className={cn("text-primary text-sm", textClassName)}>{text}</p>
    )}
    {isLoading ? (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-start w-full"
        className="bg-surface-hover mt-1 h-4 w-40"
      />
    ) : (
      subText && (
        <span className={cn("text-secondary inline-block w-fit text-xs")}>
          {subText}
        </span>
      )
    )}
  </div>
);
