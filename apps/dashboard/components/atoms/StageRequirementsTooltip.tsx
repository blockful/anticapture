"use client"

import { StageBadge } from "./StageBadge";

interface StageRequirement {
  name: string;
  value: string;
}

interface StageRequirementsTooltipProps {
  currentStage: number;
  nextStage: number;
  requirements: StageRequirement[];
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
  return (
    <div className="absolute left-0 top-full mt-2 sm:translate-x z-50" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Tooltip Arrow */}
      <div className="absolute left-1/2 top-0 -mt-1 h-2 w-2 sm:translate-x rotate-45 transform border-l border-t border-lightDark bg-darkest"></div>
      
      <div className="relative w-[calc(100vw-44px)] sm:w-[25vw] min-w-[375px] rounded-lg border border-lightDark bg-darkest">
        {/* Header */}
        <div className="p-4">
          <div className="flex justify-start">
            <StageBadge stage={currentStage} className="mb-3" />
          </div>

          {/* Title */}
          <h3 className="text-base font-roboto font-normal uppercase leading-5 tracking-wider text-white text-start">
            HAS VECTORS THAT CAN MAKE IT VULNERABLE
          </h3>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-lightDark" />

        {/* Requirements List */}
        <div className="p-4 font-normal">
          <p className="mb-2 text-sm text-white text-start">
            {requirements.length} items missing to{" "}
            <span className="text-tangerine">Stage {nextStage}</span>
          </p>
          <div className="flex flex-col gap-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[#EF4444] text-base font-bold">×</span>
                <span className="text-sm text-foreground">
                  {req.name}
                  {req.value && (
                    <span className="text-foreground">{' >'} {req.value}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 