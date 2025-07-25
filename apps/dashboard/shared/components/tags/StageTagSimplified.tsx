"use client";

import { Stage } from "@/shared/types/enums/Stage";
import { cn } from "@/shared/utils/";
import { CheckCircle, XCircle } from "lucide-react";

interface StageTagSimplifiedProps {
  stage: Stage;
  isCompleted?: boolean;
  className?: string;
}

export const StageTagSimplified = ({
  stage,
  isCompleted = true,
  className = "",
}: StageTagSimplifiedProps) => {
  const icon = isCompleted ? (
    <CheckCircle className="text-success" size={14} />
  ) : (
    <XCircle className="text-error" size={14} />
  );

  const textColor = isCompleted ? "text-primary" : "text-secondary";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span
        className={cn(
          "!text-alternative-sm font-mono font-medium tracking-[6%]",
          textColor,
        )}
      >
        STAGE {stage}
      </span>
    </div>
  );
};
