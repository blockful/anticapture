import { cn } from "@/shared/utils";
import { ReactNode } from "react";

export const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
  className,
}: {
  title: string;
  text: string;
  subText: string | ReactNode;
  className?: string;
}) => (
  <div className={cn("md:bg-surface-default md:p-3", className)}>
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    <p className="text-primary mb-1 text-sm">{text}</p>
    <p className="text-secondary text-xs">{subText}</p>
  </div>
);
