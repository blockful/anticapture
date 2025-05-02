"use client";

import {
  TheSectionLayout,
  Stage,
  RiskLevelCard,
  StageTag,
  DaoAvatarIcon,
  StagesCardRequirements,
} from "@/components/atoms";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { RiskLevel } from "@/lib/enums";
import { DaoIdEnum } from "@/lib/types/daos";
import { BarChart } from "lucide-react";

interface ResilienceStagesSectionProps {
  currentDaoStage: Stage;
  daoId: DaoIdEnum;
}

export const ResilienceStagesSection = ({
  currentDaoStage,
  daoId,
}: ResilienceStagesSectionProps) => {
  const StagesToDaoAvatarPosition: Record<Stage, string> = {
    [Stage.ZERO]: "right-[75%]",
    [Stage.ONE]: "right-[25%]",
    [Stage.TWO]: "right-0 hidden",
  };

  const StagesToLineStyle: Record<Stage, string> = {
    [Stage.ZERO]: "w-[25%] bg-error",
    [Stage.ONE]: "w-[75%] bg-warning",
    [Stage.TWO]: "w-full bg-success",
  };

  const StagesToBorderColor: Record<Stage, string> = {
    [Stage.ZERO]: "border-error",
    [Stage.ONE]: "border-warning",
    [Stage.TWO]: "border-success",
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.resilienceStages.title}
      subHeader={<RiskLevelCard status={RiskLevel.LOW} />}
      icon={<BarChart className="text-foreground" />}
      description={SECTIONS_CONSTANTS.resilienceStages.description}
      anchorId={SECTIONS_CONSTANTS.resilienceStages.anchorId}
    >
      <div className="flex flex-col gap-2">
        <div className="w-full py-6">
          {/* Timeline Component */}
          <div className="relative h-[2px] bg-middleDark">
            {/* Horizontal Line */}
            <div
              className={cn(
                "absolute left-0 h-[2px]",
                StagesToLineStyle[currentDaoStage],
              )}
            ></div>

            {/* Stage 0 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-dark">
              <StageTag tagStage={Stage.ZERO} daoStage={currentDaoStage} />
            </div>

            {/* Stage 1 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark">
              <StageTag tagStage={Stage.ONE} daoStage={currentDaoStage} />
            </div>

            {/* Current Position Indicator */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 translate-x-1/2",
                StagesToDaoAvatarPosition[currentDaoStage],
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center overflow-hidden rounded-full border-[2px] bg-white",
                  StagesToBorderColor[currentDaoStage],
                )}
              >
                <DaoAvatarIcon isRounded daoId={daoId} />
              </div>
            </div>

            {/* Stage 2 */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-dark">
              <StageTag tagStage={Stage.TWO} daoStage={currentDaoStage} />
            </div>
          </div>
        </div>

        <StagesCardRequirements daoStage={currentDaoStage} />
      </div>
    </TheSectionLayout>
  );
};
