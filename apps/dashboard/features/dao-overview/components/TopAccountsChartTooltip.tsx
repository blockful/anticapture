"use client";

import React from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { EntityType } from "@/features/holders-and-delegates";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: TopAccountChartData }[];
  daoId: DaoIdEnum;
  type: EntityType;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  daoId,
  type,
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const variation = data.variation?.absoluteChange ?? 0;
  const isPositive = variation >= 0;
  const variationClassName = isPositive
    ? "text-surface-solid-success"
    : "text-surface-solid-error";
  const extraField =
    type === "tokenHolder"
      ? `Delegates to: ${data.latestDelegate || "N/A"}`
      : `Delegators: ${data.totalDelegators ?? 0}`;

  return (
    <div className="bg-surface-background text-secondary flex flex-col gap-1 rounded-md p-2 text-sm">
      <span className="text-primary">{data.name}</span>
      <span>
        Balance: {formatNumberUserReadable(data.balance)} {daoId}
      </span>
      <span>
        Variation:{" "}
        <span className={variationClassName}>
          {formatNumberUserReadable(Math.abs(variation), 0)}
        </span>
      </span>
      <span>{extraField}</span>
    </div>
  );
};
