"use client";

import { ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, Cell, LabelList, Tooltip } from "recharts";
import { ChartConfig, ChartContainer } from "@/shared/components/ui/chart";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { Stage } from "@/shared/types/enums/Stage";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { useMemo } from "react";
import { DividerDefault } from "@/shared/design-system/divider/DividerDefault";
import { DaoProtectionLevelsTooltip } from "@/features/panel/components/DaoProtectionLevelsTooltip";
import { DefaultLink } from "@/shared/design-system/links/default-link";

const chartConfig: ChartConfig = {
  value: {
    label: "Value",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export const DaoProtectionLevels = () => {
  // Calculate stage distribution from real DAO data
  const stageData = useMemo(() => {
    // Get all DAOs
    const daoIds = Object.values(DaoIdEnum);

    // Count DAOs by stage
    const stageCounts = {
      [Stage.ZERO]: 0,
      [Stage.ONE]: 0,
      [Stage.TWO]: 0,
      [Stage.UNKNOWN]: 0,
      [Stage.NONE]: 0,
    };

    daoIds.forEach((daoId) => {
      const daoConfig = daoConfigByDaoId[daoId];
      let stage: Stage;

      if (!daoConfig.governanceImplementation) {
        stage = Stage.UNKNOWN;
      } else {
        stage = getDaoStageFromFields({
          fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
          noStage: daoConfig.noStage,
        });
      }

      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    // Map to chart data format
    return [
      {
        stage: "Stage 0",
        value: stageCounts[Stage.ZERO],
        riskLevel: "High Risk",
        color: "var(--color-error)",
        description:
          "DAOs that have a critical weakness that could let an attacker influence or take over governance",
      },
      {
        stage: "Stage 1",
        value: stageCounts[Stage.ONE],
        riskLevel: "Medium Risk",
        color: "var(--color-warning)",
        description:
          "DAOs that have no critical weaknesses, but still have a medium-risk issue that could affect governance.",
      },
      {
        stage: "Stage 2",
        value: stageCounts[Stage.TWO],
        riskLevel: "Low Risk",
        color: "var(--color-success)",
        description:
          "DAOs with no significant risks and strong protection against governance attacks.",
      },
      {
        stage: "No Stage",
        value: stageCounts[Stage.NONE],
        riskLevel: "Doesn't apply",
        color: "var(--color-surface-hover)",
        description:
          "DAOs that don't qualify for the staging system because they lack autonomous execution and rely on a centralized entity.",
      },
    ];
  }, []);

  // Calculate total monitored DAOs
  const totalMonitored = useMemo(() => {
    return Object.values(DaoIdEnum).length;
  }, []);

  return (
    <div className="bg-surface-default flex w-full flex-col gap-2 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-[20px] tracking-[0.78px]">
          DAO Governance Risk Levels
        </h3>
        <p className="text-secondary text-sm font-normal leading-[20px]">
          This platform monitors DAO governance risks and rates them through
          Anticapture&apos;s Stage system.
        </p>
        <DefaultLink
          href="https://blockful.gitbook.io/anticapture/anticapture/framework"
          variant="highlight"
          openInNewTab
        >
          Learn the Stage Criteria
          <ChevronRight className="size-4" />
        </DefaultLink>
      </div>

      {/* Status indicators */}
      <div className="flex w-full flex-col gap-2">
        <DividerDefault isHorizontal />
        <div className="border-t-brand flex items-center gap-1.5 border-b-0 border-l-4 border-r-0 border-t-0 pl-3">
          <p className="text-primary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
            {totalMonitored} DAOs monitored by Anticapture
          </p>
        </div>
        <DividerDefault isHorizontal />
      </div>

      {/* Bar Chart */}
      <div className="flex flex-col gap-2">
        <div className="relative flex h-[75px] w-full items-end">
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <BarChart
              data={stageData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="stage" hide axisLine={false} tickLine={false} />
              <Tooltip
                content={DaoProtectionLevelsTooltip}
                cursor={false}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <Bar dataKey="value" radius={[0, 0, 0, 0]} minPointSize={1}>
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  className="text-primary text-xs font-medium"
                  fill="var(--color-primary)"
                  formatter={(value: number) => value}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Labels */}
        <div className="flex w-full">
          {stageData.map((item, index) => (
            <div
              key={index}
              className="flex flex-1 flex-col items-center justify-center"
            >
              <p className="text-primary text-xs font-medium leading-[16px]">
                {item.stage}
              </p>
              <p className="text-secondary text-xs font-medium leading-[16px]">
                {item.riskLevel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
