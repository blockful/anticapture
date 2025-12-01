"use client";

import React from "react";
import { BarProps } from "recharts";
import { Address } from "viem";
import { formatNumberUserReadable } from "@/shared/utils";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";

export interface CustomBarShapeProps extends BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  payload: TopAccountChartData;
}

export const CustomBarShape: React.FC<CustomBarShapeProps> = ({
  x,
  y,
  width,
  height,
  value,
  payload,
}) => {
  const isPositive = value >= 0;
  const color = isPositive ? "#45ca76" : "#e26868";
  const barHeight = Math.abs(height);
  const barY = isPositive ? y : y - barHeight;

  return (
    <g>
      <rect x={x} y={barY} width={width} height={barHeight} fill={color} />
      <text
        x={x + width / 2}
        y={isPositive ? barY - 8 : barY + barHeight + 16}
        fill={color}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
      >
        {`${isPositive ? "+" : "-"}${formatNumberUserReadable(Math.abs(value), 0)}`}
      </text>
      {payload.address && (
        <foreignObject
          x={x + width / 2 - 12}
          y={isPositive ? y - 50 : y + height - 30}
          width={24}
          height={24}
        >
          <EnsAvatar
            address={payload.address as Address}
            size="sm"
            variant="rounded"
          />
        </foreignObject>
      )}
    </g>
  );
};
