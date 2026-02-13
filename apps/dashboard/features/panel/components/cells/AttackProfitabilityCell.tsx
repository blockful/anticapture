"use client";

import { ReactNode, useEffect } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import { SkeletonRow, BadgeStatus } from "@/shared/components";
import { formatNumberUserReadable } from "@/shared/utils";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { useAttackProfitability } from "@/features/panel/hooks";
import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react";
import { RiskLevelText } from "@/features/panel/components/RiskLevelText";
import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";

const riskLevelIcons: Record<RiskLevel, ReactNode> = {
  [RiskLevel.HIGH]: <AlertTriangleIcon className="text-error size-4" />,
  [RiskLevel.MEDIUM]: <AlertCircleIcon className="text-warning size-4" />,
  [RiskLevel.LOW]: <></>,
  [RiskLevel.NONE]: <></>,
};

interface AttackProfitabilityCellProps {
  daoId: DaoIdEnum;
  onSortValueChange: (value: number | null) => void;
}

export const AttackProfitabilityCell = ({
  daoId,
  onSortValueChange,
}: AttackProfitabilityCellProps) => {
  const { profitability, isLoading } = useAttackProfitability(daoId);
  const attackProfitRiskLevel =
    getDaoRiskAreas(daoId)["ATTACK PROFITABILITY"].riskLevel;

  useEffect(() => {
    onSortValueChange(profitability?.value ?? null);
  }, [profitability, onSortValueChange]);

  if (isLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-end w-full"
        className="h-5 w-full max-w-20 lg:max-w-32"
      />
    );
  }

  if (profitability === null || profitability === undefined) {
    return (
      <Tooltip
        title="Attack Profitability"
        className="text-left"
        triggerClassName="w-full"
        tooltipContent={
          <p className="text-secondary text-sm font-normal leading-5">
            No data available to calculate attack profitability.
          </p>
        }
      >
        <div className="ml-auto w-min px-2">
          <BadgeStatus children="N/A" variant="dimmed" />
        </div>
      </Tooltip>
    );
  }

  const formattedValue = formatNumberUserReadable(
    Math.abs(profitability.value),
    1,
  );

  return (
    <Tooltip
      title="Attack Profitability"
      titleRight={<RiskLevelText level={attackProfitRiskLevel} />}
      className="text-left"
      triggerClassName="w-full"
      tooltipContent={
        <div className="flex flex-col gap-2">
          <p className="text-secondary text-sm font-normal leading-5">
            {profitability.value >= 0
              ? "This DAO presents high economic incentive for an attacker."
              : "This DAO presents low economic incentive for an attacker."}
          </p>
          <p className="text-secondary text-xs font-medium leading-4">
            Click to see details
          </p>
        </div>
      }
    >
      <ClickableCell
        href={`/${daoId.toLowerCase()}/attack-profitability`}
        className="justify-end py-4 text-end text-sm font-normal"
      >
        <span className="flex items-center gap-2 px-2">
          {riskLevelIcons[attackProfitRiskLevel]}${formattedValue}
        </span>
      </ClickableCell>
    </Tooltip>
  );
};
