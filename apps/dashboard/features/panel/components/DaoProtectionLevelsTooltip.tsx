"use client";

import { TooltipProps } from "recharts";

type StageData = {
  stage: string;
  value: number;
  riskLevel: string;
  color: string;
  description?: string;
};

export const DaoProtectionLevelsTooltip = ({
  active,
  payload,
  coordinate,
}: TooltipProps<number, string>) => {
  if (
    !active ||
    !payload?.length ||
    !coordinate ||
    coordinate.x === undefined ||
    coordinate.y === undefined
  )
    return null;

  const data = payload[0]?.payload as StageData;

  return (
    <div
      className="border-light-dark bg-surface-default text-primary rounded-lg border px-3 py-2 shadow-lg"
      style={{
        position: "absolute",
        left: coordinate.x,
        top: coordinate.y - 10,
        transform: "translate(-50%, -100%)",
        minWidth: "200px",
      }}
    >
      <p className="text-primary text-sm font-medium">{data.stage}</p>
      <p className="text-secondary text-xs">{data.riskLevel}</p>
      <p className="text-primary mt-1 text-xs font-medium">
        {data.value} DAO{data.value !== 1 ? "s" : ""}
      </p>
      {data.description && (
        <p className="text-secondary mt-2 max-w-[250px] text-xs">
          {data.description}
        </p>
      )}
    </div>
  );
};
