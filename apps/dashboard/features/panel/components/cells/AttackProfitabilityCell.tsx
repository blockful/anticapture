"use client";

import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react";
import { ReactNode, useEffect } from "react";

import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import { RiskLevelText } from "@/features/panel/components/RiskLevelText";
import { useAttackProfitability } from "@/features/panel/hooks";
import { SkeletonRow, BadgeStatus } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { formatNumberUserReadable } from "@/shared/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

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

  const economicSecurityRiskArea =
    getDaoRiskAreas(daoId)[RiskAreaEnum.ECONOMIC_SECURITY];
  const economicSecurityRiskLevel = economicSecurityRiskArea.riskLevel;

  const attackProfitInfos =
    economicSecurityRiskArea.govImplItems[
      GovernanceImplementationEnum.ATTACK_PROFITABILITY
    ];

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

  if (economicSecurityRiskLevel === RiskLevel.NONE) {
    const daoConfig = daoConfigByDaoId[daoId];
    const isNotApplicable =
      daoConfig.attackProfitability?.riskLevel === RiskLevel.LOW;
    const tooltipDescription =
      daoConfig.attackExposure?.defenseAreas?.[RiskAreaEnum.ECONOMIC_SECURITY]
        ?.description;

    return (
      <Tooltip
        title={
          isNotApplicable ? "Not applicable for this DAO" : "No data available"
        }
        className="text-left"
        triggerClassName="w-full"
        disableMobileClick
        tooltipContent={
          <p className="text-secondary text-sm font-normal leading-5">
            {tooltipDescription ??
              "Economic security data is not yet available. Our team is actively working to integrate it."}
          </p>
        }
      >
        <div className="ml-auto w-fit px-2">
          <BadgeStatus variant="dimmed">
            {isNotApplicable ? "Not applicable" : "No Data"}
          </BadgeStatus>
        </div>
      </Tooltip>
    );
  }

  const profitabilityValue = Math.max(profitability?.value ?? 0, 0);
  const formattedValue =
    profitabilityValue === 0
      ? "<$10K"
      : `$${formatNumberUserReadable(profitabilityValue, 1)}`;

  return (
    <Tooltip
      title={"Attack Profitability"}
      titleRight={<RiskLevelText level={economicSecurityRiskLevel} />}
      className="text-left"
      triggerClassName="w-full"
      disableMobileClick
      tooltipContent={
        <div className="flex flex-col gap-2">
          <p className="text-secondary text-sm font-normal leading-5">
            {attackProfitInfos?.impact}
          </p>
          <p className="text-secondary text-xs font-medium leading-4">
            Click on the cell to see details
          </p>
        </div>
      }
    >
      <ClickableCell
        href={`/${daoId.toLowerCase()}/attack-profitability`}
        className="justify-end py-4 text-end text-sm font-normal"
      >
        <span className="flex items-center gap-2 px-2">
          {riskLevelIcons[economicSecurityRiskLevel]}
          {formattedValue}
        </span>
      </ClickableCell>
    </Tooltip>
  );
};
