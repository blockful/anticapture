"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
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
  const { top5Delegators, delegatorsVotingPowerDetails, loading } =
    useVotingPower({
      daoId,
      address,
    });

  if (!top5Delegators || top5Delegators.length === 0) {
    return null;
  }

  const currentVotingPower = Number(
    BigInt(delegatorsVotingPowerDetails?.accountPower?.votingPower || 0) /
      BigInt(10 ** 18),
  );

  const totalTop5Delegators = top5Delegators?.reduce((acc, item) => {
    return acc + Number(item.balance);
  }, 0);

  const othersValue = Math.abs(totalTop5Delegators - currentVotingPower);

  const pieData = top5Delegators.map((item) => ({
    name: item.accountId || "",
    value: Number(item.balance),
  }));

  // Add "Others" slice to pie chart if there's remaining voting power
  if (othersValue > 0) {
    pieData.push({
      name: "Others",
      value: othersValue,
    });
  }

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
            // Use gray color for "Others" slice, otherwise use the color scheme
            const color =
              entry.name === "Others"
                ? "#9CA3AF"
                : PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
            return <Cell key={`cell-${index}`} fill={color} />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
