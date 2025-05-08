"use client";

import { Stage } from "@/components/atoms/StageTag";
import { cn } from "@/lib/client/utils";
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

  const textColor = isCompleted ? "text-white" : "text-foreground";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span
        className={cn(
          "font-mono text-[13px] font-medium leading-[18px] tracking-[6%]",
          textColor,
        )}
      >
        STAGE {stage}
      </span>
    </div>
  );
};
