"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatAddress } from "@/shared/utils/formatAddress";
import { renderCustomizedLabel } from "@/features/holders-and-delegates/delegate/drawer/voting-power/utils/renderCustomizedLabel";

// Create chart config for delegators
const createDelegatorsChartConfig = (
  delegators: any[],
  othersValue: number,
): Record<string, { label: string; color: string }> => {
  const config: Record<string, { label: string; color: string }> = {};

  // Add delegators to config
  delegators.forEach((delegator, index) => {
    const key = delegator.accountId || `delegator-${index}`;
    config[key] = {
      label: formatAddress(delegator.accountId || ""),
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    };
  });

  // Add Others if there's remaining voting power
  if (othersValue > 0) {
    config["others"] = {
      label: "Others",
      color: "#9CA3AF", // Gray color for Others
    };
  }

  return config;
};

const PieChartCustomTooltip: React.FC<
  TooltipProps<number, string> & {
    chartConfig: Record<string, { label: string; color: string }>;
    currentVotingPower: number;
  }
> = ({ active, payload, chartConfig, currentVotingPower }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const value = data.value !== undefined ? data.value : 0;
  const name = data.name || "";
  const percentage = ((value / currentVotingPower) * 100).toFixed(1);

  const config = chartConfig[name];
  const label = config?.label || name;

  return (
    <div className="rounded border bg-white p-3 text-black shadow-lg">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-600">
          Voting Power: <strong>{formatNumberUserReadable(value)}</strong>
        </p>
        <p className="text-xs text-gray-600">
          Percentage: <strong>{percentage}%</strong>
        </p>
      </div>
    </div>
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

  const chartConfig = createDelegatorsChartConfig(top5Delegators, othersValue);

  const pieData = top5Delegators.map((item) => ({
    name: item.accountId || "",
    value: Number(item.balance),
  }));

  // Add "Others" slice to pie chart if there's remaining voting power
  if (othersValue > 0) {
    pieData.push({
      name: "others",
      value: othersValue,
    });
  }

  return (
    <>
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
              const color = chartConfig[entry.name]?.color || "#9CA3AF";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip
            content={
              <PieChartCustomTooltip
                chartConfig={chartConfig}
                currentVotingPower={currentVotingPower}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};
