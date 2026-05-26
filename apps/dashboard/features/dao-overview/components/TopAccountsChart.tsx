"use client";

import React, { useState, useCallback } from "react";
import type { BarProps } from "recharts";
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Address } from "viem";

import type { CustomBarShapeProps } from "@/features/dao-overview/components/TopAccountsChartBarShape";
import { CustomBarShape } from "@/features/dao-overview/components/TopAccountsChartBarShape";
import { CustomTooltip } from "@/features/dao-overview/components/TopAccountsChartTooltip";
import { useTopAccountsChartData } from "@/features/dao-overview/hooks/useTopAccountsChartData";
import type { EntityType } from "@/features/holders-and-delegates";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface TopAccountChartData {
  address: Address;
  balance: number;
  variation: { absoluteChange: number; percentageChange: number };
  name?: string;
  latestDelegate?: Address;
  totalDelegators?: number;
  delegate?: Address;
  delegationsCount?: number;
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
  const chartConfig = useTopAccountsChartData({ chartData });

  const handleOpenDrawer = useCallback(
    (item: { address: string }) => setSelectedAddress(item.address),
    [],
  );

  const handleCloseDrawer = useCallback(() => setSelectedAddress(null), []);

  return (
    <div className="border-light-dark text-primary lg:bg-surface-default relative flex h-52 w-full items-center justify-center lg:rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartConfig.data} margin={{ top: 50, bottom: 20 }}>
          <Tooltip
            content={<CustomTooltip daoId={daoId} type={entityType} />}
            cursor={false}
          />
          <ReferenceLine y={0} stroke="#3f3f46" />
          <Bar
            dataKey={(item: TopAccountChartData) =>
              item.variation?.absoluteChange ?? 0
            }
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
        address={selectedAddress || "None"}
        daoId={daoId}
      />
    </div>
  );
};
