"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { groupDelegatorsByPercentage } from "../utils/groupDelegatorsByPercentage";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#000"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-alternative-sm font-mono font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const ThePieChart = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: string;
}) => {
  const { top5Delegators } = useVotingPower({
    daoId,
    address,
  });

  console.log("top5Delegators", top5Delegators);

  // Use the utility function to group delegators
  const { significantDelegators, othersValue } =
    groupDelegatorsByPercentage(top5Delegators);

  if (!top5Delegators || top5Delegators.length === 0) {
    return null;
  }

  // Create pie data with significant items
  const pieData = significantDelegators.map((item) => ({
    name: item.accountId || "",
    value: Number(item.balance),
  }));

  // Add "Others" category if there are minor items
  if (othersValue > 0) {
    pieData.push({
      name: "Others",
      value: othersValue,
    });
  }

  console.log("pieData", pieData);

  return (
    <ResponsiveContainer width={200} height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          dataKey="value"
          blendStroke={true}
          stroke="none"
        >
          {pieData.map((entry, index) => {
            let color;
            if (entry.name === "Others") {
              color = "#9CA3AF";
            } else {
              color = PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
            }

            return <Cell key={`cell-${index}`} fill={color} />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
