"use client";

import { Eye, Target } from "lucide-react";
import { BarChart, Bar, XAxis, Cell, LabelList } from "recharts";
import { ChartConfig, ChartContainer } from "@/shared/components/ui/chart";

// Fake data for now
const stageData = [
  {
    stage: "No Stage",
    value: 1,
    riskLevel: "Doesn't apply",
    color: "var(--color-surface-hover)",
  },
  {
    stage: "Stage 0",
    value: 2,
    riskLevel: "High Risk",
    color: "var(--color-error)",
  },
  {
    stage: "Stage 1",
    value: 1,
    riskLevel: "Medium Risk",
    color: "var(--color-warning)",
  },
  {
    stage: "Stage 2",
    value: 0,
    riskLevel: "Low Risk",
    color: "var(--color-success)",
  },
];

const chartConfig: ChartConfig = {
  value: {
    label: "Value",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export const DaoProtectionLevels = () => {
  return (
    <div className="bg-surface-default flex w-full flex-col gap-4 rounded-lg p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-primary text-alternative-sm font-mono font-medium uppercase leading-[20px] tracking-[0.78px]">
          DAO Protection Levels
        </h3>
        <p className="text-secondary text-sm font-normal leading-[20px]">
          Anticapture monitors vulnerabilities across DAOs and rate their
          protection level using the Stages framework.
        </p>
      </div>

      {/* Status indicators */}
      <div className="flex w-full flex-col gap-2">
        <div className="border-t-brand flex items-center gap-1.5 border-b-0 border-l-4 border-r-0 border-t-0 pl-3">
          <Eye className="text-secondary size-3.5" />
          <p className="text-secondary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
            currently:
          </p>
          <p className="text-primary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
            4 DAOs monitored
          </p>
        </div>
        <div className="border-t-brand flex items-center gap-1.5 border-b-0 border-l-4 border-r-0 border-t-0 pl-3">
          <Target className="text-secondary size-3.5" />
          <p className="text-secondary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
            Goal:
          </p>
          <p className="text-primary text-alternative-xs font-mono font-medium uppercase leading-[16px] tracking-[0.72px]">
            Entire ecosystem
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex flex-col gap-2">
        <div className="relative flex h-[60px] w-full items-end">
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <BarChart
              data={stageData}
              margin={{ top: 28, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="stage" hide axisLine={false} tickLine={false} />
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
