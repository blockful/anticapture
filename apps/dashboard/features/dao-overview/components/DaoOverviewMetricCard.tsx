import { cn } from "@/shared/utils";
import { ReactNode } from "react";

export const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
  className,
  textClassName,
  isLoading = false,
}: {
  title: string;
  text: string;
  subText: string | ReactNode;
  className?: string;
  textClassName?: string;
  isLoading?: boolean;
}) => (
  <div
    className={cn(
      "md:bg-surface-default flex flex-col justify-start md:p-3",
      className,
    )}
  >
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    <p
      className={cn("text-primary text-sm", textClassName, {
        "bg-secondary text-secondary animate-pulse": isLoading,
      })}
    >
      {text}
    </p>
    <span
      className={cn("text-secondary inline-block w-fit text-xs", {
        "bg-secondary animate-pulse": isLoading,
      })}
    >
      {subText}
    </span>
  </div>
);
