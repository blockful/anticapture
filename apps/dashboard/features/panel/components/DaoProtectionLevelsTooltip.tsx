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
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <p className="text-primary text-xs font-normal">{data.stage}</p>
        </div>

        <p className="text-primary text-xs font-normal">
          {data.value} DAO{data.value !== 1 ? "s" : ""}
        </p>
      </div>

      {data.description && (
        <p className="text-secondary mt-2 max-w-[250px] text-xs">
          {data.description}
        </p>
      )}
    </div>
  );
};
