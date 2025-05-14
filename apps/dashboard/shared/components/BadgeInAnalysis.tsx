"use client";

import { cn } from "@/shared/utils/utils";
import { Clock2 } from "lucide-react";

export const BadgeInAnalysis = ({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 rounded-full bg-white/10 px-1.5 py-0.5 text-foreground",
        className,
      )}
    >
      <Clock2 className={cn("size-4", iconClassName)} />
      {"In analysis"}
    </div>
  );
};
