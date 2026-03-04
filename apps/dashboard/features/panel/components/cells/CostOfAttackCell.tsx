"use client";

import { useEffect } from "react";

import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import { useCostOfAttack } from "@/features/panel/hooks";
import { SkeletonRow, BadgeStatus } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskAreaEnum } from "@/shared/types/enums";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { formatNumberUserReadable } from "@/shared/utils";

interface CostOfAttackCellProps {
  daoId: DaoIdEnum;
  onSortValueChange: (value: number | null) => void;
}

export const CostOfAttackCell = ({
  daoId,
  onSortValueChange,
}: CostOfAttackCellProps) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const supportsLiquidTreasury =
    daoConfig.attackProfitability?.supportsLiquidTreasuryCall;
  const { costOfAttack, isLoading } = useCostOfAttack(daoId);

  useEffect(() => {
    onSortValueChange(costOfAttack ?? null);
  }, [costOfAttack, onSortValueChange]);

  if (isLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-end w-full"
        className="h-5 w-full max-w-20 lg:max-w-32"
      />
    );
  }

  if (!supportsLiquidTreasury) {
    const isNotApplicable =
      daoConfig.attackProfitability?.riskLevel === RiskLevel.LOW;
    const tooltipDescription =
      daoConfig.attackExposure?.defenseAreas?.[RiskAreaEnum.ECONOMIC_SECURITY]
        ?.description;

    return (
      <Tooltip
        tooltipContent={
          <p className="text-secondary text-sm font-normal leading-5">
            {tooltipDescription ??
              "Economic security data is not yet available. Our team is actively working to integrate it."}
          </p>
        }
        title={
          isNotApplicable ? "Not applicable for this DAO" : "No data available"
        }
        className="text-left"
        triggerClassName="w-full"
      >
        <div className="ml-auto w-fit px-2">
          <BadgeStatus variant="dimmed">
            {isNotApplicable ? "Not applicable" : "No Data"}
          </BadgeStatus>
        </div>
      </Tooltip>
    );
  }

  if (costOfAttack === null) {
    return (
      <div className="ml-auto w-min px-2">
        <BadgeStatus variant="dimmed">No Data</BadgeStatus>
      </div>
    );
  }

  return (
    <ClickableCell
      href={`/${daoId.toLowerCase()}/attack-profitability`}
      className="justify-end py-4 text-end text-sm font-normal"
    >
      <span className="text-secondary px-2">
        ${formatNumberUserReadable(costOfAttack)}
      </span>
    </ClickableCell>
  );
};
