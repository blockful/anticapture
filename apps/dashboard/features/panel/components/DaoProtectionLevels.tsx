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

/* Bars are sized against the busiest stage, so the widest bar always fills the track. */
const EMPTY_BAR_WIDTH = "0.5rem";

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
    <div className="bg-surface-default flex w-full flex-col justify-between gap-3 p-4">
      <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-5 tracking-[0.78px]">
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

            return (
              <div
                key={stage}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.25rem] items-center gap-3"
              >
                <div className="flex flex-col text-xs font-medium leading-4">
                  <span className={labelClassName}>{label}</span>
                  <span className="text-secondary">{riskLevel}</span>
                </div>
                <Tooltip
                  asChild
                  title={label}
                  titleRight={`${count} DAO${count === 1 ? "" : "s"}`}
                  tooltipContent={
                    <p className="text-secondary text-sm font-normal leading-5">
                      {description}
                    </p>
                  }
                >
                  <div
                    className={cn("h-7", barClassName)}
                    style={{
                      width: count
                        ? `${(count / busiestStageCount) * 100}%`
                        : EMPTY_BAR_WIDTH,
                    }}
                  />
                </Tooltip>
                <span className="text-primary text-xs font-medium leading-4">
                  {count}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};
