"use client";

import {
  ArrowLeftRight,
  TheSectionLayout,
  Stage,
  RiskLevelCard,
} from "@/components/atoms";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { RiskLevel } from "@/lib/enums";

interface ResilienceStagesSectionProps {
  currentDaoStage: Stage;
}

export const ResilienceStagesSection = ({
  currentDaoStage,
}: ResilienceStagesSectionProps) => {
  const { setDays, days } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title={
        <div className="flex flex-row items-center gap-2 whitespace-nowrap">
          {SECTIONS_CONSTANTS.resilienceStages.title}
          <RiskLevelCard status={RiskLevel.LOW} />
        </div>
      }
      icon={<ArrowLeftRight className="text-foreground" />}
      days={days}
      description={SECTIONS_CONSTANTS.resilienceStages.description}
      anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
    >
      <div className="w-full py-6">
        {/* Timeline Component */}
        <div className="relative h-1 bg-gray-400">
          {/* Horizontal Line */}
          <div className="absolute left-0 h-1 w-[75%] bg-[#FACC15]"></div>

          {/* Stage 0 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="rounded-lg border-2 border-[#FACC15] bg-[#0E0E0E] px-4 py-1.5">
              <span className="text-sm font-medium text-[#FACC15]">
                STAGE 0
              </span>
            </div>
          </div>

          {/* Stage 1 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-lg border-2 border-[#FACC15] bg-[#0E0E0E] px-4 py-1.5">
              <span className="text-sm font-medium text-[#FACC15]">
                STAGE 1
              </span>
            </div>
          </div>

          {/* Current Position Indicator */}
          <div className="absolute right-[25%] top-1/2 -translate-y-1/2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#EC4899]">
              <span
                role="img"
                aria-label="Current position"
                className="text-base"
              >
                🦄
              </span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="rounded-lg border-2 border-[#6B7280] bg-[#1F2937] px-4 py-1.5">
              <span className="text-sm font-medium text-[#9CA3AF]">
                STAGE 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </TheSectionLayout>
  );
};
