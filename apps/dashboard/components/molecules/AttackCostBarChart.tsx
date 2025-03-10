"use client";

import { formatCurrencyValue } from "@/lib/client/utils";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample data - replace with your actual data
const data = [
  {
    name: "Liquid Treasury",
    value: 4000,
  },
  {
    name: "Delegated Supply",
    value: 3000,
  },
  {
    name: "Active Supply",
    value: 2000,
  },
  {
    name: "Average Turnout",
    value: 2780,
  },
  {
    name: "Total Supply",
    value: 1890,
  },
];

interface AttackCostBarChartProps {
  className?: string;
}

const AttackCostBarChart = ({ className }: AttackCostBarChartProps) => {
  // Custom tooltip component to avoid inheritance issues
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-gray-200 bg-white p-2 shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">{`Cost: $${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom X-axis label component
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;

    // Split the text at whitespace and create lines with max length
    const MAX_CHARS_PER_LINE = 10;
    const words = payload.value.split(" ");
    const lines = [];
    let currentLine = "";

    // Group words into lines without exceeding max length
    words.forEach((word: string) => {
      if (currentLine.length + word.length <= MAX_CHARS_PER_LINE) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    // Add the last line if it's not empty
    if (currentLine) {
      lines.push(currentLine);
    }

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={0}
            dy={16 + index * 12} // Increase dy for each line
            textAnchor="middle"
            fill="gray"
            fontSize={10}
            className="font-medium"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // Custom Y-axis label component
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dx={-10}
          textAnchor="end"
          fill="#666"
          fontSize={10}
          className="font-medium"
        >
          {formatCurrencyValue(payload.value)}
        </text>
      </g>
    );
  };

  return (
    <div className={`h-80 w-full ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
          }}
        >
          <XAxis
            dataKey="name"
            height={60}
            tick={<CustomXAxisTick />}
            interval={0}
          />
          <YAxis tick={<CustomYAxisTick />} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="value"
            fill="#22c55e"
            name="Attack Cost"
            radius={[8, 8, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttackCostBarChart;
