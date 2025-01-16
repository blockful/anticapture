"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartMetrics, chartMetrics } from "@/lib/mocked-data";

const transformChartMetrics = (data: ChartMetrics[]) => {
  return data.map((item: ChartMetrics) => ({
    date: new Date(Number(item.date)).toISOString().split("T")[0],
    high: Number(item.high),
  }));
};

const formattedChartMetrics = transformChartMetrics(chartMetrics);
console.log("formattedChartMetrics", formattedChartMetrics);

export const TheChart = () => {
  return (
    <div className="flex h-14 w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedChartMetrics}>
          <XAxis tickLine={false} axisLine={false} tick={false} />
          <YAxis tickLine={false} axisLine={false} tick={false} />
          <Tooltip />
          <Area
            dataKey="high"
            type="linear"
            fill="#fff"
            fillOpacity={0.4}
            stroke="#fff"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
