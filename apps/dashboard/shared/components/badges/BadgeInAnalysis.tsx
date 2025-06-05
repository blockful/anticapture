"use client";

import { cn } from "@/shared/utils/";
import { Clock2 } from "lucide-react";

export const BadgeInAnalysis = ({
  className,
  iconClassName,
  hasIcon = true,
}: {
  className?: string;
  iconClassName?: string;
  hasIcon?: boolean;
}) => {
  return (
    <div
      className={cn(
        "text-foreground flex w-fit items-center gap-2 rounded-full bg-white/10 px-1.5 py-0.5",
        className,
      )}
    >
      {hasIcon && <Clock2 className={cn("size-4", iconClassName)} />}
      <p className="whitespace-nowrap">In analysis</p>
    </div>
  );
};
