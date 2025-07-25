"use client";

import { Stage } from "@/shared/types/enums/Stage";
import { OutlinedBox } from "@/shared/components/boxes/OutlinedBox";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { ReactNode } from "react";

interface StageRequirementsTooltipProps {
  currentStage: Stage;
  nextStage: Stage;
  requirements: string[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const StageRequirementsTooltip = ({
  currentStage,
  nextStage,
  requirements,
  onMouseEnter,
  onMouseLeave,
}: StageRequirementsTooltipProps) => {
  const variantIcons: Record<Stage, ReactNode> = {
    [Stage.ZERO]: <AlertTriangleIcon className="text-error size-4" />,
    [Stage.ONE]: <AlertCircleIcon className="text-warning size-4" />,
    [Stage.TWO]: <CheckCircleIcon className="text-success size-4" />,
    [Stage.NONE]: <></>,
  };
  const nextStageTextColor = Array.from([
    "text-error",
    "text-warning",
    "text-success",
  ])[Number(nextStage) % 3] as "text-error" | "text-warning" | "text-success";
  return (
    <div
      className="sm:translate-x absolute top-[calc(100%-8px)] left-0 z-50 mt-2"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="stage-tooltip-box-shadow border-light-dark bg-surface-background relative w-[calc(100vw-44px)] min-w-[375px] rounded-lg border sm:w-[25vw]">
        {/* Header */}
        <div className="p-4">
          <div className="flex justify-start">
            <OutlinedBox
              variant={
                Array.from(["error", "warning", "success"])[
                  Number(currentStage) % 3
                ] as "error" | "warning" | "success"
              }
              className="mb-2 p-1"
              hideIcon={true}
            >
              <span className="text-sm font-medium">STAGE {currentStage}</span>
            </OutlinedBox>
          </div>

          {/* Title */}
          <h3 className="text-primary text-start font-mono text-base leading-5 font-normal tracking-wider uppercase">
            HAS VECTORS THAT CAN MAKE IT VULNERABLE
          </h3>
        </div>

        {/* Divider */}
        <div className="bg-surface-contrast h-px w-full" />

        {/* Requirements List */}
        <div className="p-4 font-normal">
          <p className="text-primary mb-2 text-start text-sm">
            {requirements.length} items missing to{" "}
            <span className={nextStageTextColor}>Stage {nextStage}</span>
          </p>
          <div className="flex flex-col gap-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                {variantIcons[currentStage]}
                <span className="text-secondary text-sm">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
