"use client";

import {
  ArrowLeftRight,
  TheSectionLayout,
  Stage,
  RiskLevelCard,
  StageTag,
} from "@/components/atoms";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { RiskLevel } from "@/lib/enums";

interface ResilienceStagesSectionProps {
  currentDaoStage: Stage;
}

export const ResilienceStagesSection = ({
  currentDaoStage,
}: ResilienceStagesSectionProps) => {
  const StagesToDaoAvatarPosition: Record<Stage, string> = {
    [Stage.ZERO]: "right-[75%]",
    [Stage.ONE]: "right-[25%]",
    [Stage.TWO]: "right-0",
  };

  const StagesToLineWidth: Record<Stage, string> = {
    [Stage.ZERO]: "w-[25%] bg-red-500",
    [Stage.ONE]: "w-[75%] bg-yellow-500",
    [Stage.TWO]: "w-full bg-green-500",
  };

  return (
    <TheSectionLayout
      title={
        <div className="flex flex-row items-center gap-2 whitespace-nowrap">
          {SECTIONS_CONSTANTS.resilienceStages.title}
          <RiskLevelCard status={RiskLevel.LOW} />
        </div>
      }
      icon={<ArrowLeftRight className="text-foreground" />}
      description={SECTIONS_CONSTANTS.resilienceStages.description}
      anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
    >
      <div className="w-full py-6">
        {/* Timeline Component */}
        <div className="relative h-1 bg-gray-400">
          {/* Horizontal Line */}
          <div
            className={cn(
              "absolute left-0 h-1",
              StagesToLineWidth[currentDaoStage],
            )}
          ></div>

          {/* Stage 0 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <StageTag tagStage={Stage.ZERO} daoStage={currentDaoStage} />
          </div>

          {/* Stage 1 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <StageTag tagStage={Stage.ONE} daoStage={currentDaoStage} />
          </div>

          {/* Current Position Indicator */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 translate-x-1/2",
              StagesToDaoAvatarPosition[currentDaoStage],
            )}
          >
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
            <StageTag tagStage={Stage.TWO} daoStage={currentDaoStage} />
          </div>
        </div>
      </div>
    </TheSectionLayout>
  );
};
