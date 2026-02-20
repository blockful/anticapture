"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { StageTag } from "@/features/resilience-stages/components";
import { Stage } from "@/shared/types/enums/Stage";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { StageTooltip } from "@/features/panel/components/tooltips/StageTooltip";
import { RiskLevelText } from "@/features/panel/components/RiskLevelText";
import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";

const STAGE_DESCRIPTIONS: Partial<Record<Stage, string>> = {
  [Stage.ZERO]:
    "A Stage 0 DAO has at least one implementation detail identified as High Risk.",
  [Stage.ONE]:
    "A Stage 1 DAO has resolved all High Risk issues but still has Medium Risk items.",
  [Stage.TWO]:
    "A Stage 2 DAO has achieved the highest level of governance security.",
  [Stage.UNKNOWN]: "Stage information not available.",
};

const getStageRiskLevel = (stage: Stage): RiskLevel => {
  if (stage === Stage.ZERO) return RiskLevel.HIGH;
  if (stage === Stage.ONE) return RiskLevel.MEDIUM;
  if (stage === Stage.TWO) return RiskLevel.LOW;
  return RiskLevel.NONE;
};

const getStageName = (stage: Stage): string => {
  const stageNumbers: Partial<Record<Stage, string>> = {
    [Stage.ZERO]: "0",
    [Stage.ONE]: "1",
    [Stage.TWO]: "2",
  };
  return `Stage ${stageNumbers[stage] ?? "Unknown"}`;
};

export const StageCell = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];

  if (!daoConfig.governanceImplementation) {
    return (
      <div className="scrollbar-none text-primary flex items-center gap-3 space-x-1 overflow-auto">
        <StageTag
          daoStage={Stage.UNKNOWN}
          tagStage={Stage.UNKNOWN}
          showStageText
        />
      </div>
    );
  }

  const stage = getDaoStageFromFields({
    fields: fieldsToArray(daoConfig.governanceImplementation.fields),
    noStage: daoConfig.noStage,
  });

  const govImplFields = daoConfig.governanceImplementation.fields || {};
  const riskFilter =
    stage === Stage.ZERO
      ? RiskLevel.HIGH
      : stage === Stage.ONE
        ? RiskLevel.MEDIUM
        : null;

  const itemsToDisplay = riskFilter
    ? Object.entries(govImplFields)
        .filter(([_, field]) => field.riskLevel === riskFilter)
        .slice(0, 3)
    : [];

  const stageRiskLevel = getStageRiskLevel(stage);
  const stageName = getStageName(stage);

  return (
    <Tooltip
      title={stageName}
      titleRight={<RiskLevelText level={stageRiskLevel} />}
      triggerClassName="w-full"
      tooltipContent={
        <StageTooltip
          description={
            STAGE_DESCRIPTIONS[stage] || "Stage information not available."
          }
          items={itemsToDisplay}
          footer="Click to see details"
        />
      }
    >
      <ClickableCell
        href={`/${daoId.toLowerCase()}/resilience-stages`}
        className="px-0 py-3 text-end text-sm font-normal lg:px-4"
      >
        <StageTag daoStage={stage} tagStage={stage} showStageText />
      </ClickableCell>
    </Tooltip>
  );
};
