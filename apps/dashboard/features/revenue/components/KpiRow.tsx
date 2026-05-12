"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import { cn } from "@/shared/utils/cn";

import { KPI_DATA } from "@/features/revenue/data/mock";

const TIME_PERIOD_OPTIONS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "MAX", value: "max" },
];

export const KpiRow = () => {
  const [timePeriod, setTimePeriod] = useState("max");

  return (
    <Card>
      {/* Header row */}
      <div className="border-border-default flex items-center justify-between border-b p-4">
        <p className="text-secondary text-sm font-medium">Usage & Adoption</p>

        {/* Desktop: SegmentedControl */}
        <SegmentedControl
          items={TIME_PERIOD_OPTIONS}
          value={timePeriod}
          size="sm"
          onValueChange={setTimePeriod}
          className="hidden lg:inline-flex"
        />

        {/* Mobile: Select dropdown */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="border-border-default bg-surface-default text-primary rounded-base border px-2 py-1 text-xs font-medium lg:hidden"
        >
          {TIME_PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI columns — 2x2 mobile, 4col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {KPI_DATA.map((kpi, index) => (
          <div
            key={kpi.title}
            className={cn(
              "p-4",
              // Desktop: vertical dividers between all 4 columns
              index < KPI_DATA.length - 1 &&
                "lg:border-border-default lg:border-r",
              // Mobile: right border on left column (index 0, 2)
              index % 2 === 0 && "border-border-default border-r lg:border-r",
              // Mobile: bottom border on top row (index 0, 1)
              index < 2 && "border-border-default border-b lg:border-b-0",
            )}
          >
            <p className="text-secondary text-sm font-medium">{kpi.title}</p>
            <p className="text-primary mt-1 font-mono text-[30px] font-medium leading-9">
              {kpi.value}
            </p>
            <p className="text-secondary mt-1 flex items-center gap-1 text-sm">
              {kpi.trend === "up" && (
                <ArrowUp className="size-3.5 text-green-600" />
              )}
              {kpi.trend === "down" && (
                <ArrowDown className="size-3.5 text-red-500" />
              )}
              <span
                className={
                  kpi.trend === "up"
                    ? "text-green-600"
                    : kpi.trend === "down"
                      ? "text-red-500"
                      : "text-secondary"
                }
              >
                {kpi.subtext}
              </span>
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};
