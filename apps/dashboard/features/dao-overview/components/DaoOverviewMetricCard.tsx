import { cn } from "@/shared/utils";
import { ReactNode } from "react";

export const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
  className,
  textClassName,
}: {
  title: string;
  text: string;
  subText: string | ReactNode;
  className?: string;
  textClassName?: string;
}) => (
  <div className={cn("md:bg-surface-default md:p-3", className)}>
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    <p className={cn("text-primary text-sm", textClassName)}>{text}</p>
    <p className="text-secondary text-xs">{subText}</p>
  </div>
);
