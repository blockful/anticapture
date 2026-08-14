"use client";

import { useMemo } from "react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { Stage } from "@/shared/types/enums/Stage";
import { cn } from "@/shared/utils/cn";

/* Bars are sized against the busiest stage. The count rides at the end of the bar,
 * so the widest bar fills the track less that label and its gap. */
const EMPTY_BAR_WIDTH = "0.5rem";
const COUNT_TRACK_WIDTH = "2rem";

const STAGE_BARS = [
  {
    stage: Stage.ZERO,
    label: "Stage 0",
    riskLevel: "High Risk",
    labelClassName: "text-error",
    barClassName: "bg-error",
    description:
      "DAOs that have a critical weakness that could let an attacker influence or take over governance",
  },
  {
    stage: Stage.ONE,
    label: "Stage 1",
    riskLevel: "Medium Risk",
    labelClassName: "text-warning",
    barClassName: "bg-warning",
    description:
      "DAOs that have no critical weaknesses, but still have a medium-risk issue that could affect governance.",
  },
  {
    stage: Stage.TWO,
    label: "Stage 2",
    riskLevel: "Low Risk",
    labelClassName: "text-success",
    barClassName: "bg-success",
    description:
      "DAOs with no significant risks and strong protection against governance attacks.",
  },
] as const;

export const DaoProtectionLevels = () => {
  const stageCounts = useMemo(() => {
    const counts: Partial<Record<Stage, number>> = {};

    Object.values(DaoIdEnum).forEach((daoId) => {
      const daoConfig = daoConfigByDaoId[daoId];
      const stage = daoConfig.governanceImplementation
        ? getDaoStageFromFields({
            fields: fieldsToArray(daoConfig.governanceImplementation.fields),
            noStage: daoConfig.noStage,
          })
        : Stage.UNKNOWN;

      counts[stage] = (counts[stage] ?? 0) + 1;
    });

    return counts;
  }, []);

  const busiestStageCount = Math.max(
    ...STAGE_BARS.map(({ stage }) => stageCounts[stage] ?? 0),
    1,
  );

  return (
    <div className="bg-surface-default flex w-full min-w-0 flex-1 flex-col justify-between gap-3.5 p-4">
      <h3 className="text-primary text-alternative-sm tracking-alternative-sm font-mono font-medium uppercase leading-5">
        Governance risk, right now
      </h3>

      <div className="flex flex-col justify-center gap-3">
        {STAGE_BARS.map(
          ({
            stage,
            label,
            riskLevel,
            labelClassName,
            barClassName,
            description,
          }) => {
            const count = stageCounts[stage] ?? 0;
            const countLabel = `${count} DAO${count === 1 ? "" : "s"}`;

            return (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-22 flex shrink-0 flex-col text-xs font-medium leading-4">
                  <span className={labelClassName}>{label}</span>
                  <span className="text-secondary">{riskLevel}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Tooltip
                    asChild
                    title={label}
                    titleRight={countLabel}
                    tooltipContent={
                      <p className="text-secondary text-sm font-normal leading-5">
                        {description}
                      </p>
                    }
                  >
                    {/* A button, not a div: the description only exists inside
                     * the tooltip, so the bar has to be reachable by keyboard. */}
                    <button
                      type="button"
                      aria-label={`${label}, ${countLabel}`}
                      className={cn(
                        "h-7 shrink-0 cursor-pointer",
                        barClassName,
                      )}
                      style={{
                        width: count
                          ? `calc((100% - ${COUNT_TRACK_WIDTH}) * ${count / busiestStageCount})`
                          : EMPTY_BAR_WIDTH,
                      }}
                    />
                  </Tooltip>
                  <span className="text-primary shrink-0 text-xs font-medium leading-4">
                    {count}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};
