"use client";

import React, { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarProps,
} from "recharts";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HoldersAndDelegatesDrawer,
  EntityType,
} from "@/features/holders-and-delegates";
import {
  CustomBarShape,
  CustomBarShapeProps,
} from "@/features/dao-overview/components/TopAccountsChartBarShape";
import { CustomTooltip } from "@/features/dao-overview/components/TopAccountsChartTooltip";
import { useTopAccountsChartData } from "@/features/dao-overview/hooks/useTopAccountsChartData";

export interface TopAccountChartData {
  address: string;
  balance: number;
  variation: { absoluteChange: number; percentageChange: number };
  name?: string;
  latestDelegate?: string;
  totalDelegators?: number;
}

export const TopAccountsChart = ({
  daoId,
  chartData,
  entityType,
}: {
  daoId: DaoIdEnum;
  chartData: TopAccountChartData[];
  entityType: EntityType;
}) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const chartConfig = useTopAccountsChartData({ chartData, daoId });

  const handleOpenDrawer = useCallback(
    (item: { address: string }) => setSelectedAddress(item.address),
    [],
  );

  const handleCloseDrawer = useCallback(() => setSelectedAddress(null), []);

  return (
    <div className="border-light-dark text-primary sm:bg-surface-default relative flex h-40 w-full items-center justify-center sm:rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartConfig.data} margin={{ top: 50, bottom: 20 }}>
          <Tooltip
            content={<CustomTooltip daoId={daoId} type={entityType} />}
            cursor={false}
          />
          <ReferenceLine y={0} stroke="#3f3f46" />
          <Bar
            dataKey="value"
            shape={(props: BarProps) => (
              <CustomBarShape {...(props as CustomBarShapeProps)} />
            )}
            onClick={handleOpenDrawer}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
      <HoldersAndDelegatesDrawer
        isOpen={!!selectedAddress}
        onClose={handleCloseDrawer}
        entityType={entityType}
        address={
          selectedAddress || "0x0000000000000000000000000000000000000000"
        }
        daoId={daoId}
      />
    </div>
  );
};
