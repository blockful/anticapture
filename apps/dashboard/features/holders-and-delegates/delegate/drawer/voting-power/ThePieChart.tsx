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
import { formatNumberUserReadable } from "@/shared/utils";
import { formatAddress } from "@/shared/utils/formatAddress";
import { renderCustomizedLabel } from "@/features/holders-and-delegates/delegate/drawer/voting-power/utils/renderCustomizedLabel";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

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
  console.log("value", value);
  console.log("currentVotingPower", currentVotingPower);
  const percentage = ((value / currentVotingPower) * 100).toFixed(2);

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
  top5Delegators,
  currentVotingPower,
  loading = false,
}: {
  top5Delegators: any[];
  currentVotingPower: number;
  loading?: boolean;
}) => {
  if (loading || !top5Delegators || top5Delegators.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-full">
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className="size-[200px] rounded-full"
        />
      </div>
    );
  }

  // Usar a mesma lógica do VotingPower
  const otherValues: ({
    __typename?: "accountBalance";
    accountId: string;
    balance: any;
  } & { rawBalance: bigint })[] = [];

  // Filtrar delegators com menos de 1% do voting power
  top5Delegators.forEach((item) => {
    if (item.rawBalance === 0n) return;

    // Calcular porcentagem usando Number para evitar divisão inteira
    const percentage = Number(
      (Number(BigInt(item.rawBalance)) /
        Number(currentVotingPower * 10 ** 18)) *
        100,
    );

    if (percentage < 1) {
      console.log(
        "Delegator com menos de 1%:",
        item.accountId,
        "percentage:",
        percentage,
      );
      otherValues.push(item);
    }
  });

  // Calcular o valor total dos delegators que serão mostrados individualmente (>= 1%)
  const totalIndividualDelegators = top5Delegators.reduce((acc, item) => {
    if (item.rawBalance === 0n) return acc;

    const percentage = Number(
      (Number(BigInt(item.rawBalance)) /
        Number(currentVotingPower * 10 ** 18)) *
        100,
    );

    // Soma apenas delegators com >= 1%
    if (percentage >= 1) {
      return acc + BigInt(item.rawBalance);
    }
    return acc;
  }, BigInt(0));

  // Others é o valor restante que completa 100%
  const othersValue =
    BigInt(currentVotingPower * 10 ** 18) - totalIndividualDelegators;

  // Create chart config
  const chartConfig: Record<string, { label: string; color: string }> = {};

  // Add delegators to config (only those with >= 1%)
  top5Delegators.forEach((delegator, index) => {
    const key = delegator.accountId || `delegator-${index}`;

    if (delegator.rawBalance === 0n) return;

    const percentage = Number(
      (Number(BigInt(delegator.rawBalance)) /
        Number(currentVotingPower * 10 ** 18)) *
        100,
    );

    // Only add delegators with >= 1% to individual config
    if (percentage >= 1) {
      console.log(
        "Delegator >= 1%:",
        delegator.accountId,
        "percentage:",
        percentage,
      );
      chartConfig[key] = {
        label: formatAddress(delegator.accountId || ""),
        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      };
    }
  });

  // Add Others if there's remaining voting power
  if (othersValue > BigInt(0)) {
    console.log("othersValue:", othersValue);
    chartConfig["others"] = {
      label: "Others",
      color: "#9CA3AF", // Gray color for Others
    };
  }

  // Create pie data
  const pieData: { name: string; value: number }[] = [];

  // Add delegators with >= 1%
  top5Delegators.forEach((item) => {
    if (item.rawBalance === 0n) return;

    const percentage = Number(
      (Number(BigInt(item.rawBalance)) /
        Number(currentVotingPower * 10 ** 18)) *
        100,
    );

    if (percentage >= 1) {
      pieData.push({
        name: item.accountId || "",
        value: Number(BigInt(item.rawBalance) / BigInt(10 ** 18)),
      });
    }
  });

  // Add "Others" slice to pie chart if there's remaining voting power
  if (othersValue > BigInt(0)) {
    pieData.push({
      name: "others",
      value: Number(othersValue / BigInt(10 ** 18)),
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
